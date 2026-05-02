"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { EntryStatus } from "@/app/generated/prisma/enums";
import { initialAddTitleEntryState } from "@/app/title/action-state";
import { addTitleToList } from "@/app/title/actions";

type AddTitleButtonsProps = {
  source: "tmdb";
  externalId: string;
  mediaType: "MOVIE" | "TV";
  initialRating?: number | null;
  initialReview?: string | null;
  showRatingReview?: boolean;
};

function StatusButton({ label, value }: { label: string; value: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="status"
      value={value}
      disabled={pending}
      className="min-h-10 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export function AddTitleButtons({
  source,
  externalId,
  mediaType,
  initialRating,
  initialReview,
  showRatingReview = false,
}: AddTitleButtonsProps) {
  const [state, formAction] = useActionState(
    addTitleToList,
    initialAddTitleEntryState,
  );

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="externalId" value={externalId} />
        <input type="hidden" name="mediaType" value={mediaType} />

        {showRatingReview ? (
          <div className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-[140px_1fr]">
            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Rating
              <select
                name="rating"
                defaultValue={initialRating ?? ""}
                className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                <option value="">No rating</option>
                {Array.from({ length: 10 }, (_, index) => index + 1).map(
                  (rating) => (
                    <option key={rating} value={rating}>
                      {rating}/10
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Short review
              <textarea
                name="review"
                defaultValue={initialReview ?? ""}
                maxLength={500}
                rows={3}
                placeholder="Add a short note about this title."
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900"
              />
            </label>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <StatusButton label="Want to Watch" value={EntryStatus.PLAN_TO_WATCH} />
          <StatusButton label="Watching" value={EntryStatus.WATCHING} />
          <StatusButton label="Completed" value={EntryStatus.COMPLETED} />
        </div>
      </form>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            state.status === "error"
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
