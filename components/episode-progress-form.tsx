"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialUpdateTitleEntryProgressState } from "@/app/title/action-state";
import { updateTitleEntryProgress } from "@/app/title/actions";

type EpisodeProgressFormProps = {
  entryId: string;
  initialProgressCurrent?: number | null;
  totalEpisodes?: number | null;
};

function ProgressSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-10 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
    >
      {pending ? "Saving..." : "Save progress"}
    </button>
  );
}

function getProgressHelp(totalEpisodes?: number | null) {
  if (typeof totalEpisodes === "number" && totalEpisodes > 0) {
    return `Enter a whole number from 0 to ${totalEpisodes}.`;
  }

  return "Total episodes unknown. Enter the number of episodes watched.";
}

export function EpisodeProgressForm({
  entryId,
  initialProgressCurrent,
  totalEpisodes,
}: EpisodeProgressFormProps) {
  const [state, formAction] = useActionState(
    updateTitleEntryProgress,
    initialUpdateTitleEntryProgressState,
  );
  const hasKnownTotal = typeof totalEpisodes === "number" && totalEpisodes > 0;
  const isOverKnownTotal =
    hasKnownTotal &&
    typeof initialProgressCurrent === "number" &&
    initialProgressCurrent > totalEpisodes;

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3"
    >
      <input type="hidden" name="entryId" value={entryId} />
      <label className="grid gap-1 text-sm font-medium text-zinc-700">
        Episode progress
        <input
          type="number"
          name="progressCurrent"
          defaultValue={initialProgressCurrent ?? ""}
          min={0}
          max={hasKnownTotal ? totalEpisodes : undefined}
          step={1}
          placeholder="Episodes watched"
          className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </label>
      <p className="text-xs leading-5 text-zinc-500">
        {getProgressHelp(totalEpisodes)} Leave blank to clear progress.
      </p>
      {isOverKnownTotal ? (
        <p className="text-xs leading-5 text-amber-700">
          Saved progress is above the current known total. Clear it or reduce it
          before saving.
        </p>
      ) : null}
      <ProgressSubmitButton />
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
    </form>
  );
}
