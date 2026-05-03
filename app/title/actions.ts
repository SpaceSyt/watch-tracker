"use server";

import { revalidatePath } from "next/cache";
import { EntryStatus, MediaType } from "@/app/generated/prisma/enums";
import type {
  AddTitleEntryState,
  UpdateTitleEntryFeedbackState,
} from "@/app/title/action-state";
import { createClient } from "@/lib/supabase/server";
import { findOrCreateTitle } from "@/lib/titles";
import { getTmdbTitleDetails } from "@/lib/tmdb";
import {
  createOrUpdateUserTitleEntry,
  deleteUserTitleEntry,
  updateUserTitleEntryFeedback,
} from "@/lib/user-title-entries";
import { getOrCreateUserProfile } from "@/lib/user-profiles";

const maxReviewLength = 500;
const minRating = 1;
const maxRating = 10;

function parseEntryRating(value: FormDataEntryValue | null) {
  if (value === null || value === "") {
    return { ok: true as const, value: null };
  }

  if (typeof value !== "string") {
    return { ok: false as const, message: "Rating must be a number." };
  }

  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < minRating || rating > maxRating) {
    return {
      ok: false as const,
      message: `Rating must be a whole number from ${minRating} to ${maxRating}.`,
    };
  }

  return { ok: true as const, value: rating };
}

function parseEntryReview(value: FormDataEntryValue | null) {
  if (value === null || value === "") {
    return { ok: true as const, value: null };
  }

  if (typeof value !== "string") {
    return { ok: false as const, message: "Review must be text." };
  }

  const review = value.trim();

  if (!review) {
    return { ok: true as const, value: null };
  }

  if (review.length > maxReviewLength) {
    return {
      ok: false as const,
      message: `Review must be ${maxReviewLength} characters or fewer.`,
    };
  }

  return { ok: true as const, value: review };
}

function getTitlePath(
  source: string,
  mediaType: MediaType,
  externalId: string,
) {
  if (
    source !== "tmdb" ||
    (mediaType !== MediaType.MOVIE && mediaType !== MediaType.TV)
  ) {
    return null;
  }

  return `/title/${source}/${mediaType.toLowerCase()}/${externalId}`;
}

function isEntryStatus(value: string): value is EntryStatus {
  return Object.values(EntryStatus).includes(value as EntryStatus);
}

function isMediaType(value: string): value is "MOVIE" | "TV" {
  return value === "MOVIE" || value === "TV";
}

function parseReleaseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

type ParsedRating = number | null | "invalid";
type ParsedReview = string | null | "invalid";

function parseRating(value: FormDataEntryValue | null): ParsedRating {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return "invalid";
  }

  if (value === "") {
    return null;
  }

  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    return "invalid";
  }

  return rating;
}

function parseReview(value: FormDataEntryValue | null): ParsedReview {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return "invalid";
  }

  const review = value.trim();

  if (review.length > maxReviewLength) {
    return "invalid";
  }

  return review || null;
}

export async function addTitleToList(
  _previousState: AddTitleEntryState,
  formData: FormData,
): Promise<AddTitleEntryState> {
  const source = formData.get("source");
  const externalId = formData.get("externalId");
  const mediaType = formData.get("mediaType");
  const status = formData.get("status");
  const shouldUpdateRating = formData.has("rating");
  const shouldUpdateReview = formData.has("review");
  const rating = shouldUpdateRating ? parseRating(formData.get("rating")) : null;
  const review = shouldUpdateReview ? parseReview(formData.get("review")) : null;

  if (source !== "tmdb") {
    return { status: "error", message: "Unsupported title source." };
  }

  if (
    typeof externalId !== "string" ||
    !externalId.trim() ||
    typeof mediaType !== "string" ||
    !isMediaType(mediaType) ||
    typeof status !== "string" ||
    !isEntryStatus(status) ||
    rating === "invalid" ||
    review === "invalid"
  ) {
    return { status: "error", message: "Invalid add-to-list request." };
  }

  if (
    status === EntryStatus.PLAN_TO_WATCH &&
    (shouldUpdateRating || shouldUpdateReview)
  ) {
    return {
      status: "error",
      message: "Ratings and reviews are available for Watching or Completed titles.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      status: "error",
      message: "Log in before adding this title to your list.",
    };
  }

  try {
    const tmdbTitle = await getTmdbTitleDetails(mediaType, externalId);
    const userProfile = await getOrCreateUserProfile(user);
    const title = await findOrCreateTitle({
      ...tmdbTitle,
      mediaType: MediaType[tmdbTitle.mediaType],
      releaseDate: parseReleaseDate(tmdbTitle.releaseDate),
    });
    const entry = await createOrUpdateUserTitleEntry({
      userId: userProfile.id,
      titleId: title.id,
      status,
      ...(shouldUpdateRating ? { rating } : {}),
      ...(shouldUpdateReview ? { review } : {}),
    });

    revalidatePath("/my");
    revalidatePath(`/title/${source}/${mediaType.toLowerCase()}/${externalId}`);

    return {
      status: "success",
      message: `Saved "${title.title}" as ${entry.status}.`,
    };
  } catch (writeError) {
    const message =
      writeError instanceof Error
        ? writeError.message
        : "Failed to add this title to your list.";

    return { status: "error", message };
  }
}

export async function updateTitleEntryFeedback(
  _previousState: UpdateTitleEntryFeedbackState,
  formData: FormData,
): Promise<UpdateTitleEntryFeedbackState> {
  const entryId = formData.get("entryId");
  const rating = parseEntryRating(formData.get("rating"));
  const review = parseEntryReview(formData.get("review"));

  if (typeof entryId !== "string" || !entryId.trim()) {
    return { status: "error", message: "Invalid saved title entry." };
  }

  if (!rating.ok) {
    return { status: "error", message: rating.message };
  }

  if (!review.ok) {
    return { status: "error", message: review.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      status: "error",
      message: "Log in before updating this saved title.",
    };
  }

  try {
    const userProfile = await getOrCreateUserProfile(user);
    const entry = await updateUserTitleEntryFeedback({
      entryId: entryId.trim(),
      userId: userProfile.id,
      rating: rating.value,
      review: review.value,
    });
    const titlePath = getTitlePath(
      entry.title.externalSource,
      entry.title.mediaType,
      entry.title.externalId,
    );

    revalidatePath("/my");

    if (titlePath) {
      revalidatePath(titlePath);
    }

    return {
      status: "success",
      message: "Saved your rating and review.",
    };
  } catch (writeError) {
    const message =
      writeError instanceof Error
        ? writeError.message
        : "Failed to update this saved title.";

    return { status: "error", message };
  }
}

export async function removeTitleFromList(formData: FormData): Promise<void> {
  const entryId = formData.get("entryId");

  if (typeof entryId !== "string" || !entryId.trim()) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return;
  }

  const entry = await deleteUserTitleEntry({
    entryId: entryId.trim(),
    authUserId: user.id,
  });

  revalidatePath("/my");

  if (!entry) {
    return;
  }

  const titlePath = getTitlePath(
    entry.title.externalSource,
    entry.title.mediaType,
    entry.title.externalId,
  );

  if (titlePath) {
    revalidatePath(titlePath);
  }
}
