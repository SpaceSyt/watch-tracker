"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { EntryStatus } from "@/app/generated/prisma/enums";
import {
  initialBatchCustomListActionState,
  initialCustomListActionState,
} from "@/app/title/action-state";
import {
  copySelectedTitlesToCustomList,
  deleteSelectedTitlesFromList,
  moveSelectedTitlesToCustomList,
  moveSelectedTitlesToStatus,
  removeSelectedTitlesFromCustomList,
  removeTitleFromList,
  removeTitleFromCustomList,
  renameCustomListFromMy,
  updateTitleEntryCustomListsFromMy,
} from "@/app/title/actions";
import { EmptyCollection } from "@/components/empty-collection";
import { EpisodeProgressSummary } from "@/components/episode-progress-summary";
import { useI18n, useLanguagePreference } from "@/components/language-preference";
import { formatEntryStatus } from "@/lib/i18n";
import type { CollectionEntry, CustomListOption } from "@/types/collection";

type MyCollectionContentProps = {
  selectedTitle: string;
  entries: CollectionEntry[];
  customLists: CustomListOption[];
  systemStatusOptions: SystemStatusOption[];
  currentCustomListId: string | null;
  currentCustomListName: string | null;
  currentSystemStatus: EntryStatus | null;
  emptyTitle: string;
  emptyDescription: string;
};

type SystemStatusOption = {
  status: EntryStatus;
  label: string;
};

function getYear(releaseDate: string | null, unknownYear: string) {
  return releaseDate ? String(new Date(releaseDate).getUTCFullYear()) : unknownYear;
}

function getMediaTypePath(mediaType: string) {
  return mediaType.toLowerCase();
}

function formatUpdatedAt(value: string, language: "en" | "zh") {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function canShowRatingReview(status: EntryStatus) {
  return status === EntryStatus.WATCHING || status === EntryStatus.COMPLETED;
}

const neutralButton =
  "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900";
const dangerButton =
  "rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-500/70 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70";
const disabledButton =
  "cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500";
const toolbarButton = neutralButton;

function SelectedEntryIdInputs({ entryIds }: { entryIds: string[] }) {
  return (
    <>
      {entryIds.map((entryId) => (
        <input key={entryId} type="hidden" name="entryId" value={entryId} />
      ))}
    </>
  );
}

function EditableCollectionTitle({
  title,
  listId,
}: {
  title: string;
  listId: string | null;
}) {
  const dictionary = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction] = useActionState(
    renameCustomListFromMy,
    initialCustomListActionState,
  );

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  if (!listId) {
    return <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>;
  }

  function submitRename() {
    const input = inputRef.current;

    if (!input || input.value.trim() === title.trim()) {
      setIsEditing(false);
      return;
    }

    formRef.current?.requestSubmit();
  }

  return (
    <div className="space-y-1">
      {isEditing ? (
        <form
          ref={formRef}
          action={formAction}
          onSubmit={() => setIsEditing(false)}
          className="max-w-md"
        >
          <input type="hidden" name="listId" value={listId} />
          <input
            ref={inputRef}
            type="text"
            name="name"
            defaultValue={title}
            maxLength={60}
            onBlur={submitRename}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsEditing(false);
              }
            }}
            className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xl font-semibold text-zinc-950"
            aria-label={dictionary.library.renameList}
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="max-w-full text-left text-xl font-semibold text-zinc-950 hover:underline"
          title={dictionary.library.clickTitleToRename}
        >
          {title}
        </button>
      )}
      {state.message ? (
        <p
          className={`text-xs ${
            state.status === "error" ? "text-red-700" : "text-zinc-500"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

type BatchListModalProps = {
  title: string;
  description: string;
  action: (formData: FormData) => void;
  entryIds: string[];
  lists: CustomListOption[];
  sourceListId?: string;
  onClose: () => void;
};

function BatchListModal({
  title,
  description,
  action,
  entryIds,
  lists,
  sourceListId,
  onClose,
}: BatchListModalProps) {
  const dictionary = useI18n();
  const [targetListId, setTargetListId] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const canSubmit = entryIds.length > 0 && targetListId !== "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4 py-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        action={action}
        onSubmit={onClose}
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="border-b border-zinc-100 px-5 py-4">
          <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>
        <div className="grid max-h-72 gap-2 overflow-auto px-5 py-4">
          <SelectedEntryIdInputs entryIds={entryIds} />
          {sourceListId ? (
            <input type="hidden" name="sourceListId" value={sourceListId} />
          ) : null}
          {lists.length === 0 ? (
            <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
              {dictionary.collectionContent.createAnotherList}
            </p>
          ) : (
            lists.map((list) => (
              <label
                key={list.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  targetListId === list.id
                    ? "border-zinc-900 bg-zinc-50 text-zinc-950"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <input
                  type="radio"
                  name="targetListId"
                  value={list.id}
                  checked={targetListId === list.id}
                  onChange={() => setTargetListId(list.id)}
                  className="h-4 w-4 border-zinc-300"
                />
                <span className="truncate">{list.name}</span>
              </label>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {dictionary.common.cancel}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            {dictionary.common.confirm}
          </button>
        </div>
      </form>
    </div>
  );
}

type BatchStatusModalProps = {
  title: string;
  description: string;
  action: (formData: FormData) => void;
  entryIds: string[];
  statuses: SystemStatusOption[];
  onClose: () => void;
};

function BatchStatusModal({
  title,
  description,
  action,
  entryIds,
  statuses,
  onClose,
}: BatchStatusModalProps) {
  const dictionary = useI18n();
  const [targetStatus, setTargetStatus] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const canSubmit = entryIds.length > 0 && targetStatus !== "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4 py-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        action={action}
        onSubmit={onClose}
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="border-b border-zinc-100 px-5 py-4">
          <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>
        <div className="grid gap-2 px-5 py-4">
          <SelectedEntryIdInputs entryIds={entryIds} />
          {statuses.map((statusOption) => (
            <label
              key={statusOption.status}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                targetStatus === statusOption.status
                  ? "border-zinc-900 bg-zinc-50 text-zinc-950"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              <input
                type="radio"
                name="targetStatus"
                value={statusOption.status}
                checked={targetStatus === statusOption.status}
                onChange={() => setTargetStatus(statusOption.status)}
                className="h-4 w-4 border-zinc-300"
              />
              <span>{statusOption.label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {dictionary.common.cancel}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={canSubmit ? neutralButton : disabledButton}
          >
            {dictionary.common.confirm}
          </button>
        </div>
      </form>
    </div>
  );
}

function CardActionMenu({
  entry,
  titleHref,
  customLists,
  currentCustomListId,
}: {
  entry: CollectionEntry;
  titleHref: string;
  customLists: CustomListOption[];
  currentCustomListId: string | null;
}) {
  const dictionary = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedListIds = new Set(
    entry.customLists.map((customList) => customList.id),
  );
  const isCustomListView = Boolean(currentCustomListId);
  const removeLabel = isCustomListView
    ? dictionary.collectionContent.removeFromThisList
    : dictionary.collectionContent.removeFromMyList;
  const removeDescription = isCustomListView
    ? dictionary.collectionContent.removeFromThisListDescription
    : dictionary.collectionContent.removeFromMyListDescription;

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
    <div ref={menuRef} className="relative shrink-0 text-sm">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white font-semibold text-zinc-700 hover:bg-zinc-100"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={dictionary.collectionContent.openActionsFor(entry.titleName)}
      >
        <span aria-hidden="true">…</span>
      </button>
      {isOpen ? (
        <div
          className="absolute right-0 z-20 mt-2 w-max min-w-44 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg"
          role="menu"
          aria-label={dictionary.collectionContent.actionsFor(entry.titleName)}
        >
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            {dictionary.collectionContent.actions}
          </p>
          <details className="border-t border-zinc-100">
            <summary className="cursor-pointer list-none whitespace-nowrap px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              {dictionary.collectionContent.changeLists}
            </summary>
            <form
              action={updateTitleEntryCustomListsFromMy}
              className="grid gap-2 px-3 pb-3"
            >
              <input type="hidden" name="entryId" value={entry.id} />
              <input
                type="hidden"
                name="source"
                value={entry.titleExternalSource}
              />
              <input
                type="hidden"
                name="externalId"
                value={entry.titleExternalId}
              />
              <input
                type="hidden"
                name="mediaType"
                value={entry.titleMediaType}
              />
              {customLists.length === 0 ? (
                <p className="text-xs leading-5 text-zinc-500">
                  {dictionary.collectionContent.createCustomListsHint}
                </p>
              ) : (
                <fieldset className="grid max-h-40 gap-1 overflow-auto pr-1">
                  <legend className="sr-only">
                    {dictionary.collectionContent.customLists}
                  </legend>
                  {customLists.map((customList) => (
                    <label
                      key={customList.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      <input
                        type="checkbox"
                        name="listId"
                        value={customList.id}
                        defaultChecked={selectedListIds.has(customList.id)}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      <span className="truncate">{customList.name}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              <button
                type="submit"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {dictionary.collectionContent.saveListChanges}
              </button>
              <Link
                href={titleHref}
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                {dictionary.collectionContent.openDetailPage}
              </Link>
            </form>
          </details>
          <details className="border-t border-zinc-100">
            <summary className="cursor-pointer list-none whitespace-nowrap px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              {removeLabel}
            </summary>
            <form
              action={
                isCustomListView ? removeTitleFromCustomList : removeTitleFromList
              }
              className="grid gap-2 px-3 pb-3"
            >
              <input type="hidden" name="entryId" value={entry.id} />
              {currentCustomListId ? (
                <input
                  type="hidden"
                  name="sourceListId"
                  value={currentCustomListId}
                />
              ) : null}
              <p className="text-xs leading-5 text-zinc-500">{removeDescription}</p>
              <button
                type="submit"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                {removeLabel}
              </button>
            </form>
          </details>
        </div>
      ) : null}
    </div>
  );
}

export function MyCollectionContent({
  selectedTitle,
  entries,
  customLists,
  systemStatusOptions,
  currentCustomListId,
  currentCustomListName,
  currentSystemStatus,
  emptyTitle,
  emptyDescription,
}: MyCollectionContentProps) {
  const dictionary = useI18n();
  const language = useLanguagePreference();
  const [copyState, copyFormAction] = useActionState(
    copySelectedTitlesToCustomList,
    initialBatchCustomListActionState,
  );
  const [moveState, moveFormAction] = useActionState(
    moveSelectedTitlesToCustomList,
    initialBatchCustomListActionState,
  );
  const [statusMoveState, statusMoveFormAction] = useActionState(
    moveSelectedTitlesToStatus,
    initialBatchCustomListActionState,
  );
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [activeBatchModal, setActiveBatchModal] = useState<
    "copy" | "move-list" | "move-status" | null
  >(null);
  const selectedEntryIdSet = useMemo(
    () => new Set(selectedEntryIds),
    [selectedEntryIds],
  );
  const allEntriesSelected =
    entries.length > 0 && selectedEntryIds.length === entries.length;
  const moveTargetLists = currentCustomListId
    ? customLists.filter((customList) => customList.id !== currentCustomListId)
    : [];
  const moveTargetStatuses = currentSystemStatus
    ? systemStatusOptions.filter(
        (statusOption) => statusOption.status !== currentSystemStatus,
      )
    : [];
  const batchRemoveAction = currentCustomListId
    ? removeSelectedTitlesFromCustomList
    : deleteSelectedTitlesFromList;
  const batchRemoveLabel = currentCustomListId
    ? dictionary.collectionContent.removeSelectedFromThisList
    : dictionary.collectionContent.deleteSelected;

  function toggleEntry(entryId: string) {
    setSelectedEntryIds((current) =>
      current.includes(entryId)
        ? current.filter((id) => id !== entryId)
        : [...current, entryId],
    );
  }

  function enterBatchMode() {
    setIsBatchMode(true);
  }

  function toggleSelectAll() {
    setSelectedEntryIds((current) =>
      current.length === entries.length ? [] : entries.map((entry) => entry.id),
    );
  }

  function exitBatchMode() {
    setSelectedEntryIds([]);
    setActiveBatchModal(null);
    setIsBatchMode(false);
  }

  const hasSelection = selectedEntryIds.length > 0;
  const canCopy = hasSelection && customLists.length > 0;
  const canRemove = hasSelection;
  const canMove = hasSelection
    ? currentCustomListId
      ? moveTargetLists.length > 0
      : moveTargetStatuses.length > 0
    : false;

  return (
    <section className="space-y-4 min-w-0">
      <div>
        <div className="flex items-center justify-between gap-4">
          <EditableCollectionTitle
            title={currentCustomListName ?? selectedTitle}
            listId={currentCustomListId}
          />
          {isBatchMode ? (
            <button
              type="button"
              onClick={exitBatchMode}
              className="w-[5.5rem] shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {dictionary.common.done}
            </button>
          ) : (
            <button
              type="button"
              onClick={enterBatchMode}
              className="w-[5.5rem] shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {dictionary.collectionContent.batchActions}
            </button>
          )}
        </div>
        <div className="mt-3 border-b border-zinc-200 dark:border-zinc-700" />
        <div className="mt-3 flex items-center justify-between gap-4">
          {isBatchMode ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={toolbarButton}
                >
                  {allEntriesSelected
                    ? dictionary.collectionContent.deselectAll
                    : dictionary.collectionContent.selectAll}
                </button>
                <span className="text-sm text-zinc-500">
                  {dictionary.collectionContent.selectedCount(
                    selectedEntryIds.length,
                  )}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form
                  action={batchRemoveAction}
                  className="flex items-center"
                >
                  <SelectedEntryIdInputs entryIds={selectedEntryIds} />
                  {currentCustomListId ? (
                    <input
                      type="hidden"
                      name="sourceListId"
                      value={currentCustomListId}
                    />
                  ) : null}
                  <button
                    type="submit"
                    disabled={!canRemove}
                    className={canRemove ? dangerButton : disabledButton}
                  >
                    {batchRemoveLabel}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setActiveBatchModal("copy")}
                  disabled={!canCopy}
                  className={canCopy ? neutralButton : disabledButton}
                >
                  {dictionary.collectionContent.copyToList}
                </button>
                {currentCustomListId ? (
                  <button
                    type="button"
                    onClick={() => setActiveBatchModal("move-list")}
                    disabled={!canMove}
                    className={canMove ? neutralButton : disabledButton}
                  >
                    {dictionary.collectionContent.moveToList}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveBatchModal("move-status")}
                    disabled={!canMove}
                    className={canMove ? neutralButton : disabledButton}
                  >
                    {dictionary.collectionContent.moveToStatus}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
              >
                {dictionary.collectionContent.sortRecentlyUpdated}
              </button>
              <div className="min-w-0 max-w-xs rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
                {dictionary.collectionContent.searchThisCollectionSoon}
              </div>
            </>
          )}
        </div>
      </div>

      {isBatchMode &&
      (copyState.message || moveState.message || statusMoveState.message) ? (
        <div className="space-y-1">
          {copyState.message ? (
            <p
              className={`text-sm ${
                copyState.status === "error" ? "text-red-700" : "text-zinc-600"
              }`}
            >
              {copyState.message}
            </p>
          ) : null}
          {moveState.message ? (
            <p
              className={`text-sm ${
                moveState.status === "error" ? "text-red-700" : "text-zinc-600"
              }`}
            >
              {moveState.message}
            </p>
          ) : null}
          {statusMoveState.message ? (
            <p
              className={`text-sm ${
                statusMoveState.status === "error"
                  ? "text-red-700"
                  : "text-zinc-600"
              }`}
            >
              {statusMoveState.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {entries.length === 0 ? (
        <EmptyCollection title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="mt-4 flex-1 overflow-y-auto">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map((entry) => {
            const titleHref = `/title/${entry.titleExternalSource}/${getMediaTypePath(entry.titleMediaType)}/${entry.titleExternalId}`;
            const isSelected = selectedEntryIdSet.has(entry.id);
            const showRatingReview = canShowRatingReview(entry.status);
            const cardClassName = [
              "relative grid grid-cols-[72px_1fr] gap-3 rounded-lg border bg-white p-3",
              "dark:bg-zinc-900",
              isSelected
                ? "border-zinc-500 dark:border-zinc-400"
                : "border-zinc-200 dark:border-zinc-700",
            ].join(" ");

            return (
              <article key={entry.id} className={cardClassName}>
                {isBatchMode ? (
                  <label className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 bg-white shadow-sm">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEntry(entry.id)}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    <span className="sr-only">
                      {dictionary.collectionContent.selectTitle(entry.titleName)}
                    </span>
                  </label>
                ) : null}
                <Link
                  href={titleHref}
                  className="flex h-28 w-[72px] items-center justify-center overflow-hidden rounded-md bg-zinc-100 text-center text-xs font-medium text-zinc-400"
                >
                  {entry.titlePosterUrl ? (
                    <Image
                      src={entry.titlePosterUrl}
                      alt=""
                      width={72}
                      height={112}
                      sizes="72px"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{dictionary.common.noPoster}</span>
                  )}
                </Link>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={titleHref}
                        className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-950 hover:underline"
                      >
                        {entry.titleName}
                      </Link>
                      <p className="mt-1 text-xs text-zinc-500">
                        {entry.titleMediaType === "MOVIE"
                          ? dictionary.common.movie
                          : dictionary.common.tv}{" "}
                        /{" "}
                        {getYear(
                          entry.titleReleaseDate,
                          dictionary.common.unknownYear,
                        )}
                      </p>
                    </div>
                    <CardActionMenu
                      entry={entry}
                      titleHref={titleHref}
                      customLists={customLists}
                      currentCustomListId={currentCustomListId}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700">
                      {formatEntryStatus(entry.status, dictionary)}
                    </span>
                    {entry.customLists.slice(0, 2).map((customList) => (
                      <span
                        key={customList.id}
                        className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600"
                      >
                        {customList.name}
                      </span>
                    ))}
                  </div>

                  <p className="mt-2 text-xs text-zinc-500">
                    {dictionary.collectionContent.updated(
                      formatUpdatedAt(entry.updatedAt, language),
                    )}
                  </p>
                  {showRatingReview ? (
                    <>
                      <p className="mt-2 text-xs font-medium text-zinc-700">
                        {dictionary.collectionContent.rating}:{" "}
                        {entry.rating
                          ? `${entry.rating}/10`
                          : dictionary.collectionContent.notRated}
                      </p>
                      {entry.review ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">
                          {entry.review}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                  <div className="mt-2">
                    <EpisodeProgressSummary
                      status={entry.status}
                      mediaType={entry.titleMediaType}
                      progressCurrent={entry.progressCurrent}
                      totalEpisodes={entry.titleTotalEpisodes}
                    />
                  </div>
                </div>
              </article>
            );
          })}
          </div>
        </div>
      )}
      {activeBatchModal === "copy" ? (
        <BatchListModal
          title={dictionary.collectionContent.copyModalTitle}
          description={dictionary.collectionContent.copyModalDescription}
          action={copyFormAction}
          entryIds={selectedEntryIds}
          lists={customLists}
          onClose={() => setActiveBatchModal(null)}
        />
      ) : null}
      {activeBatchModal === "move-list" && currentCustomListId ? (
        <BatchListModal
          title={dictionary.collectionContent.moveModalTitle}
          description={dictionary.collectionContent.moveModalDescription}
          action={moveFormAction}
          entryIds={selectedEntryIds}
          lists={moveTargetLists}
          sourceListId={currentCustomListId}
          onClose={() => setActiveBatchModal(null)}
        />
      ) : null}
      {activeBatchModal === "move-status" && currentSystemStatus ? (
        <BatchStatusModal
          title={dictionary.collectionContent.moveStatusModalTitle}
          description={dictionary.collectionContent.moveStatusModalDescription}
          action={statusMoveFormAction}
          entryIds={selectedEntryIds}
          statuses={moveTargetStatuses}
          onClose={() => setActiveBatchModal(null)}
        />
      ) : null}
    </section>
  );
}
