import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const maxCustomListNameLength = 60;
export const maxCustomListAssignmentsPerEntry = 20;

type NormalizeCustomListNameResult =
  | {
      ok: true;
      name: string;
      normalizedName: string;
    }
  | {
      ok: false;
      message: string;
    };

type CreateCustomListInput = {
  userId: string;
  name: string;
};

type ListCustomListsForUserInput = {
  userId: string;
};

type EntryCustomListInput = {
  userId: string;
  entryId: string;
};

type AddEntryToCustomListInput = EntryCustomListInput & {
  listId: string;
};

type BatchCustomListEntriesInput = {
  userId: string;
  entryIds: string[];
  targetListId: string;
};

type BatchMoveCustomListEntriesInput = BatchCustomListEntriesInput & {
  sourceListId: string;
};

type ReplaceEntryCustomListsInput = EntryCustomListInput & {
  listIds: string[];
};

export function normalizeCustomListName(
  value: string,
): NormalizeCustomListNameResult {
  const name = value.trim().replace(/\s+/g, " ");

  if (!name) {
    return { ok: false, message: "Custom list name is required." };
  }

  if (name.length > maxCustomListNameLength) {
    return {
      ok: false,
      message: `Custom list name must be ${maxCustomListNameLength} characters or fewer.`,
    };
  }

  return {
    ok: true,
    name,
    normalizedName: name.toLocaleLowerCase("en-US"),
  };
}

export async function createCustomList(input: CreateCustomListInput) {
  const normalized = normalizeCustomListName(input.name);

  if (!normalized.ok) {
    throw new Error(normalized.message);
  }

  const existingList = await prisma.customList.findUnique({
    where: {
      userId_normalizedName: {
        userId: input.userId,
        normalizedName: normalized.normalizedName,
      },
    },
  });

  if (existingList) {
    throw new Error("A custom list with this name already exists.");
  }

  try {
    return await prisma.customList.create({
      data: {
        userId: input.userId,
        name: normalized.name,
        normalizedName: normalized.normalizedName,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("A custom list with this name already exists.");
    }

    throw error;
  }
}

export async function listCustomListsForUser(
  input: ListCustomListsForUserInput,
) {
  return prisma.customList.findMany({
    where: {
      userId: input.userId,
    },
    orderBy: [
      {
        name: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
}

export async function getCustomListAssignmentsForEntry(
  input: EntryCustomListInput,
) {
  const entry = await prisma.userTitleEntry.findFirst({
    where: {
      id: input.entryId,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  if (!entry) {
    throw new Error("Saved title entry not found.");
  }

  return prisma.customListEntry.findMany({
    where: {
      userId: input.userId,
      entryId: input.entryId,
    },
    include: {
      list: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function addEntryToCustomList(input: AddEntryToCustomListInput) {
  return prisma.$transaction(async (tx) => {
    await assertOwnedEntry(tx, input);
    await assertOwnedLists(tx, {
      userId: input.userId,
      listIds: [input.listId],
    });

    return tx.customListEntry.upsert({
      where: {
        userId_listId_entryId: {
          userId: input.userId,
          listId: input.listId,
          entryId: input.entryId,
        },
      },
      update: {},
      create: {
        userId: input.userId,
        listId: input.listId,
        entryId: input.entryId,
      },
      include: {
        list: true,
      },
    });
  });
}

export async function removeEntryFromCustomList(
  input: AddEntryToCustomListInput,
) {
  return prisma.customListEntry.deleteMany({
    where: {
      userId: input.userId,
      listId: input.listId,
      entryId: input.entryId,
    },
  });
}

export async function batchAddEntriesToCustomList(
  input: BatchCustomListEntriesInput,
) {
  const entryIds = getUniqueIds(input.entryIds);

  if (entryIds.length === 0) {
    throw new Error("Select at least one saved title.");
  }

  return prisma.$transaction(async (tx) => {
    const ownedEntries = await assertOwnedEntries(tx, {
      userId: input.userId,
      entryIds,
    });

    await assertOwnedLists(tx, {
      userId: input.userId,
      listIds: [input.targetListId],
    });

    await tx.customListEntry.createMany({
      data: ownedEntries.map((entry) => ({
        userId: input.userId,
        listId: input.targetListId,
        entryId: entry.id,
      })),
      skipDuplicates: true,
    });

    return {
      count: ownedEntries.length,
    };
  });
}

export async function batchMoveEntriesBetweenCustomLists(
  input: BatchMoveCustomListEntriesInput,
) {
  const entryIds = getUniqueIds(input.entryIds);

  if (entryIds.length === 0) {
    throw new Error("Select at least one saved title.");
  }

  return prisma.$transaction(async (tx) => {
    const ownedEntries = await assertOwnedEntries(tx, {
      userId: input.userId,
      entryIds,
    });

    await assertOwnedLists(tx, {
      userId: input.userId,
      listIds: Array.from(new Set([input.sourceListId, input.targetListId])),
    });

    const sourceAssignments = await tx.customListEntry.findMany({
      where: {
        userId: input.userId,
        listId: input.sourceListId,
        entryId: {
          in: ownedEntries.map((entry) => entry.id),
        },
      },
      select: {
        entryId: true,
      },
    });

    if (sourceAssignments.length !== ownedEntries.length) {
      throw new Error("One or more saved titles are not in the source list.");
    }

    await tx.customListEntry.createMany({
      data: ownedEntries.map((entry) => ({
        userId: input.userId,
        listId: input.targetListId,
        entryId: entry.id,
      })),
      skipDuplicates: true,
    });

    if (input.sourceListId !== input.targetListId) {
      await tx.customListEntry.deleteMany({
        where: {
          userId: input.userId,
          listId: input.sourceListId,
          entryId: {
            in: ownedEntries.map((entry) => entry.id),
          },
        },
      });
    }

    return {
      count: ownedEntries.length,
    };
  });
}

export async function replaceEntryCustomListAssignments(
  input: ReplaceEntryCustomListsInput,
) {
  const listIds = getUniqueIds(input.listIds);

  if (listIds.length > maxCustomListAssignmentsPerEntry) {
    throw new Error(
      `A saved title can be assigned to ${maxCustomListAssignmentsPerEntry} custom lists or fewer.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    await assertOwnedEntry(tx, input);
    await assertOwnedLists(tx, {
      userId: input.userId,
      listIds,
    });

    await tx.customListEntry.deleteMany({
      where: {
        userId: input.userId,
        entryId: input.entryId,
      },
    });

    if (listIds.length > 0) {
      await tx.customListEntry.createMany({
        data: listIds.map((listId) => ({
          userId: input.userId,
          listId,
          entryId: input.entryId,
        })),
        skipDuplicates: true,
      });
    }

    return tx.customListEntry.findMany({
      where: {
        userId: input.userId,
        entryId: input.entryId,
      },
      include: {
        list: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  });
}

function getUniqueIds(values: string[]) {
  const ids = values.map((value) => value.trim()).filter(Boolean);

  if (ids.length !== values.length) {
    throw new Error("Custom list selection is invalid.");
  }

  return Array.from(new Set(ids));
}

async function assertOwnedEntry(
  tx: Prisma.TransactionClient,
  input: EntryCustomListInput,
) {
  const entry = await tx.userTitleEntry.findFirst({
    where: {
      id: input.entryId,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  if (!entry) {
    throw new Error("Saved title entry not found.");
  }
}

async function assertOwnedEntries(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    entryIds: string[];
  },
) {
  const entries = await tx.userTitleEntry.findMany({
    where: {
      userId: input.userId,
      id: {
        in: input.entryIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (entries.length !== input.entryIds.length) {
    throw new Error("One or more saved titles were not found.");
  }

  return entries;
}

async function assertOwnedLists(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    listIds: string[];
  },
) {
  if (input.listIds.length === 0) {
    return;
  }

  const lists = await tx.customList.findMany({
    where: {
      userId: input.userId,
      id: {
        in: input.listIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (lists.length !== input.listIds.length) {
    throw new Error("One or more custom lists were not found.");
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
