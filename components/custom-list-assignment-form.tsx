"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  initialCreateCustomListState,
  initialUpdateTitleEntryCustomListsState,
} from "@/app/title/action-state";
import {
  createCustomListForTitle,
  updateTitleEntryCustomLists,
} from "@/app/title/actions";

type CustomListOption = {
  id: string;
  name: string;
};

type CustomListAssignmentFormProps = {
  entryId: string;
  source: "tmdb";
  externalId: string;
  mediaType: "MOVIE" | "TV";
  customLists: CustomListOption[];
  selectedListIds: string[];
};

function SubmitButton({
  idleLabel,
  pendingLabel,
}: {
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-10 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

function ActionMessage({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      role={status === "error" ? "alert" : "status"}
      className={`rounded-md px-3 py-2 text-sm font-medium ${
        status === "error"
          ? "border border-red-200 bg-red-50 text-red-700"
          : "border border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {message}
    </p>
  );
}

function HiddenTitleFields({
  entryId,
  source,
  externalId,
  mediaType,
}: Pick<
  CustomListAssignmentFormProps,
  "entryId" | "source" | "externalId" | "mediaType"
>) {
  return (
    <>
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="externalId" value={externalId} />
      <input type="hidden" name="mediaType" value={mediaType} />
    </>
  );
}

export function CustomListAssignmentForm({
  entryId,
  source,
  externalId,
  mediaType,
  customLists,
  selectedListIds,
}: CustomListAssignmentFormProps) {
  const selectedListIdSet = new Set(selectedListIds);
  const [createState, createFormAction] = useActionState(
    createCustomListForTitle,
    initialCreateCustomListState,
  );
  const [assignmentState, assignmentFormAction] = useActionState(
    updateTitleEntryCustomLists,
    initialUpdateTitleEntryCustomListsState,
  );

  return (
    <div className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-950">Custom lists</h3>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          User-created lists only. Watching, Plan to Watch, and Completed stay
          as status views.
        </p>
      </div>

      <form action={createFormAction} className="grid gap-2">
        <HiddenTitleFields
          entryId={entryId}
          source={source}
          externalId={externalId}
          mediaType={mediaType}
        />
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          New custom list
          <input
            type="text"
            name="name"
            maxLength={60}
            placeholder="Favorites"
            className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>
        <SubmitButton idleLabel="Create and add" pendingLabel="Creating..." />
        <ActionMessage status={createState.status} message={createState.message} />
      </form>

      <form action={assignmentFormAction} className="grid gap-3">
        <HiddenTitleFields
          entryId={entryId}
          source={source}
          externalId={externalId}
          mediaType={mediaType}
        />

        {customLists.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-500">
            No custom lists yet. Create one above to add this title.
          </p>
        ) : (
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-zinc-700">
              Assign this saved title
            </legend>
            {customLists.map((customList) => (
              <label
                key={customList.id}
                className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
              >
                <input
                  type="checkbox"
                  name="listId"
                  value={customList.id}
                  defaultChecked={selectedListIdSet.has(customList.id)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span>{customList.name}</span>
              </label>
            ))}
          </fieldset>
        )}

        <SubmitButton idleLabel="Save custom lists" pendingLabel="Saving..." />
        <ActionMessage
          status={assignmentState.status}
          message={assignmentState.message}
        />
      </form>
    </div>
  );
}
