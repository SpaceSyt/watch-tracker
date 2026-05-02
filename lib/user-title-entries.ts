import { EntryStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type UpsertUserTitleEntryInput = {
  userId: string;
  titleId: string;
  status: EntryStatus;
};

type UpdateUserTitleEntryFeedbackInput = {
  entryId: string;
  userId: string;
  rating: number | null;
  review: string | null;
};

export async function createOrUpdateUserTitleEntry(
  input: UpsertUserTitleEntryInput,
) {
  return prisma.userTitleEntry.upsert({
    where: {
      userId_titleId: {
        userId: input.userId,
        titleId: input.titleId,
      },
    },
    update: {
      status: input.status,
    },
    create: {
      userId: input.userId,
      titleId: input.titleId,
      status: input.status,
    },
  });
}

export async function updateUserTitleEntryFeedback(
  input: UpdateUserTitleEntryFeedbackInput,
) {
  const entry = await prisma.userTitleEntry.findFirst({
    where: {
      id: input.entryId,
      userId: input.userId,
    },
    include: {
      title: true,
    },
  });

  if (!entry) {
    throw new Error("Saved title entry not found.");
  }

  return prisma.userTitleEntry.update({
    where: {
      id: entry.id,
    },
    data: {
      rating: input.rating,
      review: input.review,
    },
    include: {
      title: true,
    },
  });
}
