"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialAddTitleEntryState } from "@/app/title/action-state";
import { addTitleToList } from "@/app/title/actions";

type AddTitleButtonsProps = {
  source: "tmdb";
  externalId: string;
  mediaType: "MOVIE" | "TV";
};

function StatusButton({ label, value }: { label: string; value: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="status"
      value={value}
      disabled={pending}
      className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export function AddTitleButtons({
  source,
  externalId,
  mediaType,
}: AddTitleButtonsProps) {
  const [state, formAction] = useActionState(
    addTitleToList,
    initialAddTitleEntryState,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-wrap gap-3">
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="externalId" value={externalId} />
        <input type="hidden" name="mediaType" value={mediaType} />
        <StatusButton label="Want to Watch" value="PLAN_TO_WATCH" />
        <StatusButton label="Watching" value="WATCHING" />
        <StatusButton label="Completed" value="COMPLETED" />
      </form>

      {state.message ? (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
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
