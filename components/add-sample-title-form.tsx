"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialAddSampleEntryState } from "@/app/my/action-state";
import { addSampleTitleEntry } from "@/app/my/actions";

function SubmitButton({ label, value }: { label: string; value: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="status"
      value={value}
      disabled={pending}
      className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export function AddSampleTitleForm() {
  const [state, formAction] = useActionState(
    addSampleTitleEntry,
    initialAddSampleEntryState,
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-500">
          Temporary Test Entry
        </p>
        <h2 className="text-lg font-semibold text-zinc-900">Add a sample title</h2>
        <p className="text-sm leading-6 text-zinc-600">
          This writes a fixed sample title to the database so the MVP add-to-list flow can be
          validated before search and real title pages exist.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        <p>
          <span className="font-medium">Source:</span> tmdb
        </p>
        <p>
          <span className="font-medium">External ID:</span> 603692
        </p>
        <p>
          <span className="font-medium">Title:</span> John Wick: Chapter 4
        </p>
        <p>
          <span className="font-medium">Media type:</span> MOVIE
        </p>
      </div>

      <form action={formAction} className="mt-5 flex flex-wrap gap-3">
        <SubmitButton label="Add as Plan To Watch" value="PLAN_TO_WATCH" />
        <SubmitButton label="Set as Watching" value="WATCHING" />
        <SubmitButton label="Set as Completed" value="COMPLETED" />
      </form>

      {state.message ? (
        <p
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
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
