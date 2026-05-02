import { EntryStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type UpsertUserTitleEntryInput = {
  userId: string;
  titleId: string;
  status: EntryStatus;
  rating?: number | null;
  review?: string | null;
};

type UpdateUserTitleEntryFeedbackInput = {
  entryId: string;
  userId: string;
  rating: number | null;
  review: string | null;
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
  const ratingReviewUpdate = {
    ...(input.rating !== undefined ? { rating: input.rating } : {}),
    ...(input.review !== undefined ? { review: input.review } : {}),
  };

  return prisma.userTitleEntry.upsert({
    where: {
      userId_titleId: {
        userId: input.userId,
        titleId: input.titleId,
      },
    },
    update: {
      status: input.status,
      ...ratingReviewUpdate,
    },
    create: {
      userId: input.userId,
      titleId: input.titleId,
      status: input.status,
      rating: input.rating ?? null,
      review: input.review ?? null,
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
