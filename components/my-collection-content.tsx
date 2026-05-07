"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EntryStatus } from "@/app/generated/prisma/enums";
import {
  deleteSelectedTitlesFromList,
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

export function MyCollectionContent({
  selectedTitle,
  entries,
  customLists,
  emptyTitle,
  emptyDescription,
}: MyCollectionContentProps) {
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const selectedEntryIdSet = useMemo(
    () => new Set(selectedEntryIds),
    [selectedEntryIds],
  );
  const allEntriesSelected =
    entries.length > 0 && selectedEntryIds.length === entries.length;

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
    setIsBatchMode(false);
  }

  return (
    <section className="space-y-4 min-w-0">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-semibold text-zinc-950">{selectedTitle}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {isBatchMode ? (
            <form
              action={deleteSelectedTitlesFromList}
              className="flex flex-wrap items-center gap-2"
            >
              {selectedEntryIds.map((entryId) => (
                <input key={entryId} type="hidden" name="entryId" value={entryId} />
              ))}
              <button
                type="button"
                onClick={toggleSelectAll}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {allEntriesSelected ? "Deselect all" : "Select all"}
              </button>
              <button
                type="submit"
                disabled={selectedEntryIds.length === 0}
                className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                Delete selected
              </button>
              <button
                type="button"
                disabled
                className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-400"
              >
                Copy to list soon
              </button>
              <button
                type="button"
                disabled
                className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-400"
              >
                Move to list soon
              </button>
              <button
                type="button"
                onClick={exitBatchMode}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Done
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={enterBatchMode}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Batch actions
            </button>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyCollection title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 min-[1380px]:grid-cols-4">
          {entries.map((entry) => {
            const titleHref = `/title/${entry.titleExternalSource}/${getMediaTypePath(entry.titleMediaType)}/${entry.titleExternalId}`;
            const selectedListIds = new Set(
              entry.customLists.map((customList) => customList.id),
            );
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
                    <details className="relative shrink-0 text-sm">
                      <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-md border border-zinc-300 bg-white font-semibold text-zinc-700 hover:bg-zinc-100">
                        <span aria-hidden="true">…</span>
                        <span className="sr-only">
                          Open actions for {entry.titleName}
                        </span>
                      </summary>
                      <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
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
                                      defaultChecked={selectedListIds.has(
                                        customList.id,
                                      )}
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
                              Removes your saved status, rating, review, and custom-list assignments for this title.
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
                    </details>
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
    </section>
  );
}
