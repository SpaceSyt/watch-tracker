import { EntryStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type UpsertUserTitleEntryInput = {
  userId: string;
  titleId: string;
  status: EntryStatus;
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
