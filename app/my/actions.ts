"use server";

import { revalidatePath } from "next/cache";
import { EntryStatus, MediaType } from "@/app/generated/prisma/enums";
import type { AddSampleEntryState } from "@/app/my/action-state";
import { createClient } from "@/lib/supabase/server";
import { findOrCreateTitle } from "@/lib/titles";
import { createOrUpdateUserTitleEntry } from "@/lib/user-title-entries";
import { getOrCreateUserProfile } from "@/lib/user-profiles";

const sampleTitle = {
  externalSource: "tmdb",
  externalId: "603692",
  title: "John Wick: Chapter 4",
  mediaType: MediaType.MOVIE,
  originalTitle: "John Wick: Chapter 4",
  description: "Temporary sample title for validating the add-to-list write flow.",
} as const;

function isEntryStatus(value: string): value is EntryStatus {
  return Object.values(EntryStatus).includes(value as EntryStatus);
}

export async function addSampleTitleEntry(
  _previousState: AddSampleEntryState,
  formData: FormData,
): Promise<AddSampleEntryState> {
  const rawStatus = formData.get("status");

  if (typeof rawStatus !== "string" || !isEntryStatus(rawStatus)) {
    return {
      status: "error",
      message: "Invalid status value.",
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
      message: "You must be logged in before adding a title.",
    };
  }

  try {
    const userProfile = await getOrCreateUserProfile(user);
    const title = await findOrCreateTitle(sampleTitle);
    const entry = await createOrUpdateUserTitleEntry({
      userId: userProfile.id,
      titleId: title.id,
      status: rawStatus,
    });

    revalidatePath("/my");

    return {
      status: "success",
      message: `Saved "${title.title}" as ${entry.status}.`,
    };
  } catch (writeError) {
    const message =
      writeError instanceof Error
        ? writeError.message
        : "Failed to save the sample title entry.";

    return {
      status: "error",
      message,
    };
  }
}
