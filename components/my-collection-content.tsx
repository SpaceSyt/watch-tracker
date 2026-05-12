"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { EntryStatus } from "@/app/generated/prisma/enums";
import { initialBatchCustomListActionState } from "@/app/title/action-state";
import {
  copySelectedTitlesToCustomList,
  deleteSelectedTitlesFromList,
  moveSelectedTitlesToCustomList,
  removeTitleFromList,
  updateTitleEntryCustomListsFromMy,
} from "@/app/title/actions";

type CustomListOption = {
  id: string;
  name: string;
};

type CollectionEntry = {
  id: string;
  status: EntryStatus;
  rating: number | null;
  review: string | null;
  progressCurrent: number | null;
  updatedAt: string;
  titleName: string;
  titlePosterUrl: string | null;
  titleExternalSource: string;
  titleExternalId: string;
  titleMediaType: string;
  titleReleaseDate: string | null;
  titleTotalEpisodes: number | null;
  customLists: CustomListOption[];
};

type MyCollectionContentProps = {
  selectedTitle: string;
  entries: CollectionEntry[];
  customLists: CustomListOption[];
  currentCustomListId: string | null;
  emptyTitle: string;
  emptyDescription: string;
};

function getYear(releaseDate: string | null) {
  return releaseDate ? String(new Date(releaseDate).getUTCFullYear()) : "Unknown year";
}

function getMediaTypePath(mediaType: string) {
  return mediaType.toLowerCase();
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function canShowEpisodeProgress(status: EntryStatus, mediaType: string) {
  return (
    mediaType === "TV" &&
    (status === EntryStatus.WATCHING || status === EntryStatus.COMPLETED)
  );
}

function canShowRatingReview(status: EntryStatus) {
  return status === EntryStatus.WATCHING || status === EntryStatus.COMPLETED;
}

function formatEpisodeProgress(
  progressCurrent: number | null,
  totalEpisodes: number | null,
) {
  const hasKnownTotal = totalEpisodes !== null && totalEpisodes > 0;

  if (progressCurrent === null) {
    return hasKnownTotal ? `Not started / ${totalEpisodes} episodes` : null;
  }

  if (!hasKnownTotal) {
    return progressCurrent === 0 ? "Not started" : `${progressCurrent} episodes`;
  }

  return progressCurrent === 0
    ? `Not started / ${totalEpisodes} episodes`
    : `${progressCurrent} / ${totalEpisodes} episodes`;
}

function EpisodeProgressSummary({
  status,
  mediaType,
  progressCurrent,
  totalEpisodes,
}: {
  status: EntryStatus;
  mediaType: string;
  progressCurrent: number | null;
  totalEpisodes: number | null;
}) {
  if (!canShowEpisodeProgress(status, mediaType)) {
    return null;
  }

  const progress = formatEpisodeProgress(progressCurrent, totalEpisodes);

  if (!progress) {
    return null;
  }

  return <p className="text-xs font-medium text-zinc-700">Progress: {progress}</p>;
}

function formatStatus(status: EntryStatus) {
  if (status === EntryStatus.PLAN_TO_WATCH) {
    return "Want to Watch";
  }

  if (status === EntryStatus.WATCHING) {
    return "Watching";
  }

  return "Completed";
}

function EmptyCollection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
        {description}
      </p>
      <Link
        href="/search"
        className="mt-5 inline-flex rounded-md border border-zinc-300 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Search titles
      </Link>
    </div>
  );
}

function SelectedEntryIdInputs({ entryIds }: { entryIds: string[] }) {
  return (
    <>
      {entryIds.map((entryId) => (
        <input key={entryId} type="hidden" name="entryId" value={entryId} />
      ))}
    </>
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
              Create another custom list before using this batch action.
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            Confirm
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
}: {
  entry: CollectionEntry;
  titleHref: string;
  customLists: CustomListOption[];
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedListIds = new Set(
    entry.customLists.map((customList) => customList.id),
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
    <div ref={menuRef} className="relative shrink-0 text-sm">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white font-semibold text-zinc-700 hover:bg-zinc-100"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Open actions for ${entry.titleName}`}
      >
        <span aria-hidden="true">…</span>
      </button>
      {isOpen ? (
        <div
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg"
          role="menu"
          aria-label={`Actions for ${entry.titleName}`}
        >
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Actions
          </p>
          <details className="border-t border-zinc-100">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Change lists
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
                  Create custom lists from the sidebar or a title detail page.
                </p>
              ) : (
                <fieldset className="grid max-h-40 gap-1 overflow-auto pr-1">
                  <legend className="sr-only">Custom lists</legend>
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
                Save list changes
              </button>
              <Link
                href={titleHref}
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Open detail page
              </Link>
            </form>
          </details>
          <details className="border-t border-zinc-100">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              Remove from my list
            </summary>
            <form action={removeTitleFromList} className="grid gap-2 px-3 pb-3">
              <input type="hidden" name="entryId" value={entry.id} />
              <p className="text-xs leading-5 text-zinc-500">
                Removes your saved status, rating, review, and custom-list
                assignments for this title.
              </p>
              <button
                type="submit"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Confirm remove
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
  currentCustomListId,
  emptyTitle,
  emptyDescription,
}: MyCollectionContentProps) {
  const [copyState, copyFormAction] = useActionState(
    copySelectedTitlesToCustomList,
    initialBatchCustomListActionState,
  );
  const [moveState, moveFormAction] = useActionState(
    moveSelectedTitlesToCustomList,
    initialBatchCustomListActionState,
  );
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [activeBatchModal, setActiveBatchModal] = useState<"copy" | "move" | null>(
    null,
  );
  const selectedEntryIdSet = useMemo(
    () => new Set(selectedEntryIds),
    [selectedEntryIds],
  );
  const allEntriesSelected =
    entries.length > 0 && selectedEntryIds.length === entries.length;
  const moveTargetLists = currentCustomListId
    ? customLists.filter((customList) => customList.id !== currentCustomListId)
    : [];

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

  return (
    <section className="space-y-4 min-w-0">
      <div className="border-b border-zinc-200 pb-3">
        <h2 className="text-xl font-semibold text-zinc-950">{selectedTitle}</h2>
        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
          {isBatchMode ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="w-fit rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {allEntriesSelected ? "Deselect all" : "Select all"}
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-zinc-500">
                  {selectedEntryIds.length} selected
                </span>
                <form
                  action={deleteSelectedTitlesFromList}
                  className="flex items-center"
                >
                  <SelectedEntryIdInputs entryIds={selectedEntryIds} />
                  <button
                    type="submit"
                    disabled={selectedEntryIds.length === 0}
                    className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400"
                  >
                    Delete selected
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setActiveBatchModal("copy")}
                  disabled={
                    selectedEntryIds.length === 0 || customLists.length === 0
                  }
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400"
                >
                  Copy to list
                </button>
                {currentCustomListId ? (
                  <button
                    type="button"
                    onClick={() => setActiveBatchModal("move")}
                    disabled={
                      selectedEntryIds.length === 0 || moveTargetLists.length === 0
                    }
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400"
                  >
                    Move to list
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Move is available inside a custom list."
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-400"
                  >
                    Move is available inside a custom list
                  </button>
                )}
                <button
                  type="button"
                  onClick={exitBatchMode}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1 rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-400 sm:max-w-xs">
                  Search this collection soon
                </div>
                <button
                  type="button"
                  disabled
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-400"
                >
                  Sort: Recently updated
                </button>
              </div>
              <button
                type="button"
                onClick={enterBatchMode}
                className="w-fit rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Batch actions
              </button>
            </div>
          )}
        </div>
      </div>

      {isBatchMode && (copyState.message || moveState.message) ? (
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
        </div>
      ) : null}

      {entries.length === 0 ? (
        <EmptyCollection title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 min-[1380px]:grid-cols-4">
          {entries.map((entry) => {
            const titleHref = `/title/${entry.titleExternalSource}/${getMediaTypePath(entry.titleMediaType)}/${entry.titleExternalId}`;
            const isSelected = selectedEntryIdSet.has(entry.id);
            const showRatingReview = canShowRatingReview(entry.status);

            return (
              <article
                key={entry.id}
                className={`relative grid grid-cols-[72px_1fr] gap-3 rounded-lg border bg-white p-3 ${
                  isSelected ? "border-zinc-900" : "border-zinc-200"
                }`}
              >
                {isBatchMode ? (
                  <label className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 bg-white shadow-sm">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEntry(entry.id)}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    <span className="sr-only">Select {entry.titleName}</span>
                  </label>
                ) : null}
                <Link
                  href={titleHref}
                  className="flex h-28 w-[72px] items-center justify-center overflow-hidden rounded-md bg-zinc-100 text-center text-xs font-medium text-zinc-400"
                >
                  {entry.titlePosterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.titlePosterUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>No poster</span>
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
                        {entry.titleMediaType} / {getYear(entry.titleReleaseDate)}
                      </p>
                    </div>
                    <CardActionMenu
                      entry={entry}
                      titleHref={titleHref}
                      customLists={customLists}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700">
                      {formatStatus(entry.status)}
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
                    Updated {formatUpdatedAt(entry.updatedAt)}
                  </p>
                  {showRatingReview ? (
                    <>
                      <p className="mt-2 text-xs font-medium text-zinc-700">
                        Rating: {entry.rating ? `${entry.rating}/10` : "Not rated"}
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
      )}
      {activeBatchModal === "copy" ? (
        <BatchListModal
          title="Copy selected titles to"
          description="Choose one custom list. Existing list memberships are kept."
          action={copyFormAction}
          entryIds={selectedEntryIds}
          lists={customLists}
          onClose={() => setActiveBatchModal(null)}
        />
      ) : null}
      {activeBatchModal === "move" && currentCustomListId ? (
        <BatchListModal
          title="Move selected titles to"
          description="Choose a destination list. Titles are removed from the current custom list only."
          action={moveFormAction}
          entryIds={selectedEntryIds}
          lists={moveTargetLists}
          sourceListId={currentCustomListId}
          onClose={() => setActiveBatchModal(null)}
        />
      ) : null}
    </section>
  );
}
