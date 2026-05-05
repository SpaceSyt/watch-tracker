"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialCreateCustomListState } from "@/app/title/action-state";
import { createCustomListFromMy } from "@/app/title/actions";

function CreateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
    >
      {pending ? "Creating..." : "Create"}
    </button>
  );
}

export function CustomListCreateForm() {
  const [state, formAction] = useActionState(
    createCustomListFromMy,
    initialCreateCustomListState,
  );

  return (
    <details className="w-full min-w-0 rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2">
      <summary className="cursor-pointer list-none text-sm font-medium text-zinc-700 hover:text-zinc-950">
        + New list
      </summary>
      <form action={formAction} className="mt-2 grid min-w-0 gap-2">
        <input
          type="text"
          name="name"
          maxLength={60}
          placeholder="List name"
          className="min-h-8 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
        />
        <CreateButton />
        {state.message ? (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`rounded-md px-2 py-1.5 text-xs font-medium ${
              state.status === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </details>
  );
}
