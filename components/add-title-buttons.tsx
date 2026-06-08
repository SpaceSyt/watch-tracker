"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  initialAddTitleEntryState,
  initialUpdateTitleEntryFeedbackState,
} from "@/app/title/action-state";
import { useI18n } from "@/components/language-preference";
import { addTitleToList, updateTitleEntryFeedback } from "@/app/title/actions";
import { EntryStatus } from "@/app/generated/prisma/enums";

type AddTitleButtonsProps = {
  source: "tmdb";
  externalId: string;
  mediaType: "MOVIE" | "TV";
  entryId?: string;
  currentStatus?: EntryStatus | null;
  initialRating?: number | null;
  initialReview?: string | null;
  showRatingReview?: boolean;
  statusAction?: ReactNode;
};

function formatEntryStatus(status: EntryStatus, dictionary: ReturnType<typeof useI18n>) {
  if (status === EntryStatus.PLAN_TO_WATCH) {
    return dictionary.titleActions.wantToWatch;
  }

  if (status === EntryStatus.WATCHING) {
    return dictionary.titleActions.watching;
  }

  return dictionary.titleActions.completed;
}

function StatusButton({
  label,
  selected,
  value,
}: {
  label: string;
  selected: boolean;
  value: EntryStatus;
}) {
  const { pending } = useFormStatus();
  const dictionary = useI18n();

  return (
    <button
      type="submit"
      name="status"
      value={value}
      disabled={pending}
      aria-pressed={selected}
      className={`min-h-10 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 disabled:text-zinc-200"
          : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 disabled:text-zinc-400"
      }`}
    >
      {pending ? dictionary.common.saving : label}
    </button>
  );
}

function FeedbackButton() {
  const { pending } = useFormStatus();
  const dictionary = useI18n();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-10 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
    >
      {pending
        ? dictionary.common.saving
        : dictionary.titleActions.saveRatingReview}
    </button>
  );
}

export function AddTitleButtons({
  source,
  externalId,
  mediaType,
  entryId,
  currentStatus,
  initialRating,
  initialReview,
  showRatingReview = false,
  statusAction,
}: AddTitleButtonsProps) {
  const dictionary = useI18n();
  const [state, formAction] = useActionState(
    addTitleToList,
    initialAddTitleEntryState,
  );
  const [feedbackState, feedbackFormAction] = useActionState(
    updateTitleEntryFeedback,
    initialUpdateTitleEntryFeedbackState,
  );
  const canEditFeedback = showRatingReview && Boolean(entryId);

  return (
    <div className="space-y-3">
      {currentStatus ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
          {dictionary.titleActions.savedStatus}:{" "}
          <span className="text-zinc-950">
            {formatEntryStatus(currentStatus, dictionary)}
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-start gap-2">
        <form action={formAction}>
          <input type="hidden" name="source" value={source} />
          <input type="hidden" name="externalId" value={externalId} />
          <input type="hidden" name="mediaType" value={mediaType} />

          <div className="flex flex-wrap gap-2">
            <StatusButton
              label={dictionary.titleActions.wantToWatch}
              selected={currentStatus === EntryStatus.PLAN_TO_WATCH}
              value={EntryStatus.PLAN_TO_WATCH}
            />
            <StatusButton
              label={dictionary.titleActions.watching}
              selected={currentStatus === EntryStatus.WATCHING}
              value={EntryStatus.WATCHING}
            />
            <StatusButton
              label={dictionary.titleActions.completed}
              selected={currentStatus === EntryStatus.COMPLETED}
              value={EntryStatus.COMPLETED}
            />
          </div>
        </form>
        {statusAction}
      </div>

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

      {canEditFeedback ? (
        <form
          action={feedbackFormAction}
          className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3"
        >
          <input type="hidden" name="entryId" value={entryId} />
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            {dictionary.titleActions.rating}
            <select
              name="rating"
              defaultValue={initialRating ?? ""}
              className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="">{dictionary.titleActions.noRating}</option>
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
            {dictionary.titleActions.shortReview}
            <textarea
              name="review"
              defaultValue={initialReview ?? ""}
              maxLength={500}
              rows={3}
              placeholder={dictionary.titleActions.reviewPlaceholder}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900"
            />
          </label>
          <FeedbackButton />
          {feedbackState.message ? (
            <p
              role={feedbackState.status === "error" ? "alert" : "status"}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                feedbackState.status === "error"
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {feedbackState.message}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
