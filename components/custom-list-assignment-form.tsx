"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  initialCreateCustomListState,
  initialUpdateTitleEntryCustomListsState,
} from "@/app/title/action-state";
import {
  createCustomListForTitle,
  updateTitleEntryCustomLists,
} from "@/app/title/actions";
import { useI18n } from "@/components/language-preference";

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
      className="min-h-9 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
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
  const dictionary = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedListIdSet = new Set(selectedListIds);
  const [createState, createFormAction] = useActionState(
    createCustomListForTitle,
    initialCreateCustomListState,
  );
  const [assignmentState, assignmentFormAction] = useActionState(
    updateTitleEntryCustomLists,
    initialUpdateTitleEntryCustomListsState,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={dictionary.titlePage.openCustomListMenu}
      >
        <span aria-hidden="true">...</span>
      </button>
      {isOpen ? (
        <div
          className="absolute right-0 z-20 mt-2 grid w-80 gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm shadow-lg"
          role="menu"
          aria-label={dictionary.titlePage.customListMenu}
        >
          <div>
            <h3 className="font-semibold text-zinc-950">
              {dictionary.titlePage.customLists}
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {dictionary.titlePage.customListsDescription}
            </p>
          </div>

          <form action={assignmentFormAction} className="grid gap-3">
            <HiddenTitleFields
              entryId={entryId}
              source={source}
              externalId={externalId}
              mediaType={mediaType}
            />

            {customLists.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
                {dictionary.library.noCustomLists}
              </p>
            ) : (
              <fieldset className="grid max-h-48 gap-2 overflow-auto pr-1">
                <legend className="text-sm font-medium text-zinc-700">
                  {dictionary.titlePage.assignThisTitle}
                </legend>
                {customLists.map((customList) => (
                  <label
                    key={customList.id}
                    className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
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

            <SubmitButton
              idleLabel={dictionary.titlePage.saveLists}
              pendingLabel={dictionary.common.saving}
            />
            <ActionMessage
              status={assignmentState.status}
              message={assignmentState.message}
            />
          </form>

          <form
            action={createFormAction}
            className="grid gap-2 border-t border-zinc-100 pt-3"
          >
            <HiddenTitleFields
              entryId={entryId}
              source={source}
              externalId={externalId}
              mediaType={mediaType}
            />
            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              {dictionary.titlePage.newCustomList}
              <input
                type="text"
                name="name"
                maxLength={60}
                placeholder={dictionary.titlePage.customListPlaceholder}
                className="min-h-9 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              />
            </label>
            <SubmitButton
              idleLabel={dictionary.titlePage.createAndAdd}
              pendingLabel={dictionary.common.creating}
            />
            <ActionMessage
              status={createState.status}
              message={createState.message}
            />
          </form>
        </div>
      ) : null}
    </div>
  );
}
