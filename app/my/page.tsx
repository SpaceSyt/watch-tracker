import { redirect } from "next/navigation";
import Link from "next/link";
import { EntryStatus } from "@/app/generated/prisma/enums";
import { removeTitleFromList } from "@/app/title/actions";
import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type MyListPageProps = {
  searchParams: Promise<{
    view?: string;
    list?: string;
  }>;
};

const systemCollections = [
  {
    key: "watching",
    status: EntryStatus.WATCHING,
    label: "Watching",
    description: "Titles currently in progress.",
  },
  {
    key: "plan-to-watch",
    status: EntryStatus.PLAN_TO_WATCH,
    label: "Plan to Watch",
    description: "Titles you want to start later.",
  },
  {
    key: "completed",
    status: EntryStatus.COMPLETED,
    label: "Completed",
    description: "Titles you have finished.",
  },
] as const;

function getYear(releaseDate: Date | null) {
  return releaseDate ? String(releaseDate.getUTCFullYear()) : "Unknown year";
}

function getMediaTypePath(mediaType: string) {
  return mediaType.toLowerCase();
}

function formatUpdatedAt(updatedAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(updatedAt);
}

function canShowEpisodeProgress(status: EntryStatus, mediaType: string) {
  return (
    mediaType === "TV" &&
    (status === EntryStatus.WATCHING || status === EntryStatus.COMPLETED)
  );
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

function collectionLinkClass(selected: boolean) {
  return `flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
    selected
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
  }`;
}

function countBadgeClass(selected: boolean) {
  return `rounded px-1.5 py-0.5 text-xs ${
    selected ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-600"
  }`;
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

export default async function MyListPage({ searchParams }: MyListPageProps) {
  if (!hasSupabaseEnv()) {
    return (
      <PageShell
        eyebrow="Library"
        title="My List"
        description="Supabase environment variables are not configured yet. Add them before testing the protected page."
      />
    );
  }

  const { view, list } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const userEmail = user.email ?? "Signed-in user";
  const userProfile = await prisma.userProfile.findUnique({
    where: {
      authUserId: user.id,
    },
    include: {
      customLists: {
        orderBy: [
          {
            name: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
        include: {
          _count: {
            select: {
              entries: true,
            },
          },
        },
      },
      entries: {
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          title: true,
          customListEntries: {
            include: {
              list: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
  const entries = userProfile?.entries ?? [];
  const customLists = userProfile?.customLists ?? [];
  const selectedCustomList = customLists.find((customList) => customList.id === list);
  const selectedSystemCollection =
    selectedCustomList === undefined
      ? systemCollections.find((collection) => collection.key === view) ??
        systemCollections[0]
      : null;
  const selectedEntries = selectedCustomList
    ? entries.filter((entry) =>
        entry.customListEntries.some(
          (listEntry) => listEntry.listId === selectedCustomList.id,
        ),
      )
    : entries.filter((entry) => entry.status === selectedSystemCollection?.status);
  const selectedTitle = selectedCustomList
    ? selectedCustomList.name
    : selectedSystemCollection?.label ?? systemCollections[0].label;
  const selectedDescription = selectedCustomList
    ? "User-created custom collection."
    : selectedSystemCollection?.description ?? systemCollections[0].description;

  return (
    <PageShell
      eyebrow="Library"
      title="My List"
      description="Browse status collections and user-created custom lists in a compact collection hub."
    >
      <div className="grid gap-6">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-500">Signed in as</p>
              <p className="mt-1 text-base font-medium text-zinc-900">
                {userEmail}
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex w-fit rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Add a title
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                System collections
              </h2>
              <nav className="grid gap-2" aria-label="System collections">
                {systemCollections.map((collection) => {
                  const selected = selectedSystemCollection?.key === collection.key;
                  const count = entries.filter(
                    (entry) => entry.status === collection.status,
                  ).length;

                  return (
                    <Link
                      key={collection.key}
                      href={`/my?view=${collection.key}`}
                      className={collectionLinkClass(selected)}
                    >
                      <span>{collection.label}</span>
                      <span className={countBadgeClass(selected)}>{count}</span>
                    </Link>
                  );
                })}
              </nav>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                User custom lists
              </h2>
              {customLists.length === 0 ? (
                <p className="rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-500">
                  Create custom lists from a saved title detail page.
                </p>
              ) : (
                <nav className="grid gap-2" aria-label="User custom lists">
                  {customLists.map((customList) => {
                    const selected = selectedCustomList?.id === customList.id;

                    return (
                      <Link
                        key={customList.id}
                        href={`/my?list=${customList.id}`}
                        className={collectionLinkClass(selected)}
                      >
                        <span className="truncate">{customList.name}</span>
                        <span className={countBadgeClass(selected)}>
                          {customList._count.entries}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Subscribed lists
              </h2>
              <p className="rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-500">
                Placeholder for a future subscribed-lists feature.
              </p>
            </section>
          </aside>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 border-b border-zinc-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  {selectedTitle}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {selectedDescription}
                </p>
              </div>
              <span className="w-fit rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-600">
                {selectedEntries.length} titles
              </span>
            </div>

            {entries.length === 0 ? (
              <EmptyCollection
                title="Your list is empty"
                description="Search for a movie or TV title, open its detail page, and choose a watch status to start building your list."
              />
            ) : selectedEntries.length === 0 ? (
              <EmptyCollection
                title="No titles in this collection"
                description="Add or assign saved titles from their title detail pages."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {selectedEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="grid grid-cols-[72px_1fr] gap-3 rounded-lg border border-zinc-200 bg-white p-3"
                  >
                    <Link
                      href={`/title/${entry.title.externalSource}/${getMediaTypePath(entry.title.mediaType)}/${entry.title.externalId}`}
                      className="flex h-28 w-[72px] items-center justify-center overflow-hidden rounded-md bg-zinc-100 text-center text-xs font-medium text-zinc-400"
                    >
                      {entry.title.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.title.posterUrl}
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
                            href={`/title/${entry.title.externalSource}/${getMediaTypePath(entry.title.mediaType)}/${entry.title.externalId}`}
                            className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-950 hover:underline"
                          >
                            {entry.title.title}
                          </Link>
                          <p className="mt-1 text-xs text-zinc-500">
                            {entry.title.mediaType} / {getYear(entry.title.releaseDate)}
                          </p>
                        </div>
                        <details className="relative shrink-0 text-sm">
                          <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-md border border-zinc-300 bg-white font-semibold text-zinc-700 hover:bg-zinc-100">
                            <span aria-hidden="true">…</span>
                            <span className="sr-only">
                              Open actions for {entry.title.title}
                            </span>
                          </summary>
                          <div className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
                            <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Actions
                            </p>
                            <details className="border-t border-zinc-100">
                              <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                                Remove from my list
                              </summary>
                              <form
                                action={removeTitleFromList}
                                className="grid gap-2 px-3 pb-3"
                              >
                                <input type="hidden" name="entryId" value={entry.id} />
                                <p className="text-xs leading-5 text-zinc-500">
                                  Removes your saved status, rating, review, and
                                  custom-list assignments for this title.
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
                        {entry.customListEntries.slice(0, 2).map((listEntry) => (
                          <span
                            key={listEntry.listId}
                            className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600"
                          >
                            {listEntry.list.name}
                          </span>
                        ))}
                      </div>

                      <p className="mt-2 text-xs text-zinc-500">
                        Updated {formatUpdatedAt(entry.updatedAt)}
                      </p>
                      <p className="mt-2 text-xs font-medium text-zinc-700">
                        Rating: {entry.rating ? `${entry.rating}/10` : "Not rated"}
                      </p>
                      {entry.review ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">
                          {entry.review}
                        </p>
                      ) : null}
                      <div className="mt-2">
                        <EpisodeProgressSummary
                          status={entry.status}
                          mediaType={entry.title.mediaType}
                          progressCurrent={entry.progressCurrent}
                          totalEpisodes={entry.title.totalEpisodes}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
