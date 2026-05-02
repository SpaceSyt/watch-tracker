"use server";

import { revalidatePath } from "next/cache";
import { EntryStatus, MediaType } from "@/app/generated/prisma/enums";
import type { AddTitleEntryState } from "@/app/title/action-state";
import { createClient } from "@/lib/supabase/server";
import { findOrCreateTitle } from "@/lib/titles";
import { getTmdbTitleDetails } from "@/lib/tmdb";
import { createOrUpdateUserTitleEntry } from "@/lib/user-title-entries";
import { getOrCreateUserProfile } from "@/lib/user-profiles";

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

export async function addTitleToList(
  _previousState: AddTitleEntryState,
  formData: FormData,
): Promise<AddTitleEntryState> {
  const source = formData.get("source");
  const externalId = formData.get("externalId");
  const mediaType = formData.get("mediaType");
  const status = formData.get("status");

  if (source !== "tmdb") {
    return { status: "error", message: "Unsupported title source." };
  }

  if (
    typeof externalId !== "string" ||
    !externalId.trim() ||
    typeof mediaType !== "string" ||
    !isMediaType(mediaType) ||
    typeof status !== "string" ||
    !isEntryStatus(status)
  ) {
    return { status: "error", message: "Invalid add-to-list request." };
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
