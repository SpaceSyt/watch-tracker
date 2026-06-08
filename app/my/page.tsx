import { redirect } from "next/navigation";
import Link from "next/link";
import { EntryStatus } from "@/app/generated/prisma/enums";
import { CustomListCreateForm } from "@/components/custom-list-create-form";
import { MyCollectionContent } from "@/components/my-collection-content";
import { PageShell } from "@/components/page-shell";
import { getServerDictionary } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type MyListPageProps = {
  searchParams: Promise<{
    view?: string;
    list?: string;
  }>;
};

const defaultSystemCollectionKey = "watching";

function collectionLinkClass(selected: boolean) {
  return `flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
    selected
      ? "border-zinc-400 bg-white text-zinc-950 shadow-sm"
      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
  }`;
}

function countBadgeClass(selected: boolean) {
  return `rounded px-1.5 py-0.5 text-xs ${
    selected ? "bg-zinc-100 text-zinc-700" : "bg-zinc-100 text-zinc-600"
  }`;
}

export default async function MyListPage({ searchParams }: MyListPageProps) {
  const dictionary = await getServerDictionary();
  const systemCollections = [
    {
      key: "plan-to-watch",
      status: EntryStatus.PLAN_TO_WATCH,
      label: dictionary.collections.planToWatch,
      description: dictionary.collections.planToWatchDescription,
    },
    {
      key: "watching",
      status: EntryStatus.WATCHING,
      label: dictionary.collections.watching,
      description: dictionary.collections.watchingDescription,
    },
    {
      key: "completed",
      status: EntryStatus.COMPLETED,
      label: dictionary.collections.completed,
      description: dictionary.collections.completedDescription,
    },
  ] as const;

  if (!hasSupabaseEnv()) {
    return (
      <PageShell
        eyebrow={dictionary.library.eyebrow}
        title={dictionary.library.title}
        description={dictionary.library.noSupabase}
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

  const userEmail = user.email ?? dictionary.common.signedInUser;
  const userProfile = await prisma.userProfile.findUnique({
    where: {
      authUserId: user.id,
    },
    select: {
      id: true,
    },
  });

  const [customLists, statusCounts] = userProfile
    ? await Promise.all([
        prisma.customList.findMany({
          where: {
            userId: userProfile.id,
          },
          orderBy: [
            {
              createdAt: "asc",
            },
            {
              name: "asc",
            },
          ],
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                entries: true,
              },
            },
          },
        }),
        prisma.userTitleEntry.groupBy({
          by: ["status"],
          where: {
            userId: userProfile.id,
          },
          _count: {
            _all: true,
          },
        }),
      ])
    : [[], []];

  const entryCountByStatus = new Map(
    statusCounts.map((count) => [count.status, count._count._all]),
  );
  const selectedCustomList = customLists.find((customList) => customList.id === list);
  const defaultSystemCollection =
    systemCollections.find(
      (collection) => collection.key === defaultSystemCollectionKey,
    ) ?? systemCollections[0];
  const selectedSystemCollection =
    selectedCustomList === undefined
      ? systemCollections.find((collection) => collection.key === view) ??
        defaultSystemCollection
      : null;
  const selectedSystemStatus =
    selectedSystemCollection?.status ?? defaultSystemCollection.status;
  const selectedEntries = userProfile
    ? await prisma.userTitleEntry.findMany({
        where: selectedCustomList
          ? {
              userId: userProfile.id,
              customListEntries: {
                some: {
                  userId: userProfile.id,
                  listId: selectedCustomList.id,
                },
              },
            }
          : {
              userId: userProfile.id,
              status: selectedSystemStatus,
            },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          status: true,
          rating: true,
          review: true,
          progressCurrent: true,
          updatedAt: true,
          title: {
            select: {
              externalSource: true,
              externalId: true,
              title: true,
              posterUrl: true,
              mediaType: true,
              releaseDate: true,
              totalEpisodes: true,
            },
          },
          customListEntries: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              list: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })
    : [];
  const selectedTitle = selectedCustomList
    ? selectedCustomList.name
    : selectedSystemCollection?.label ?? defaultSystemCollection.label;
  const totalEntryCount = systemCollections.reduce(
    (total, collection) => total + (entryCountByStatus.get(collection.status) ?? 0),
    0,
  );
  const serializedSelectedEntries = selectedEntries.map((entry) => {
    const canShowRatingReview =
      entry.status === EntryStatus.WATCHING ||
      entry.status === EntryStatus.COMPLETED;
    const canShowEpisodeProgress =
      entry.title.mediaType === "TV" && canShowRatingReview;

    return {
      id: entry.id,
      status: entry.status,
      rating: canShowRatingReview ? entry.rating : null,
      review: canShowRatingReview ? entry.review : null,
      progressCurrent: canShowEpisodeProgress ? entry.progressCurrent : null,
      updatedAt: entry.updatedAt.toISOString(),
      titleName: entry.title.title,
      titlePosterUrl: entry.title.posterUrl,
      titleExternalSource: entry.title.externalSource,
      titleExternalId: entry.title.externalId,
      titleMediaType: entry.title.mediaType,
      titleReleaseDate: entry.title.releaseDate?.toISOString() ?? null,
      titleTotalEpisodes: canShowEpisodeProgress
        ? entry.title.totalEpisodes
        : null,
      customLists: entry.customListEntries.map((listEntry) => ({
        id: listEntry.list.id,
        name: listEntry.list.name,
      })),
    };
  });

  return (
    <PageShell
      eyebrow={dictionary.library.eyebrow}
      title={dictionary.library.title}
      description={dictionary.library.description}
      wide
    >
      <div className="grid gap-5">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-500">
                {dictionary.library.signedInAs}
              </p>
              <p className="mt-1 text-base font-medium text-zinc-900">
                {userEmail}
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex w-fit rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              {dictionary.library.addTitle}
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="space-y-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {dictionary.library.systemCollections}
              </h2>
              <nav
                className="grid gap-2"
                aria-label={dictionary.library.systemCollections}
              >
                {systemCollections.map((collection) => {
                  const selected = selectedSystemCollection?.key === collection.key;
                  const count = entryCountByStatus.get(collection.status) ?? 0;

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
                {dictionary.library.customLists}
              </h2>
              {customLists.length === 0 ? (
                <p className="rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-500">
                  {dictionary.library.noCustomLists}
                </p>
              ) : (
                <nav
                  className="grid gap-2"
                  aria-label={dictionary.library.customLists}
                >
                  {customLists.map((customList) => {
                    const selected = selectedCustomList?.id === customList.id;

                    return (
                      <Link
                        key={customList.id}
                        href={`/my?list=${encodeURIComponent(customList.id)}`}
                        className={`${collectionLinkClass(selected)} group`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            aria-hidden="true"
                            className={`opacity-0 transition-opacity group-hover:opacity-100 ${
                              selected ? "text-zinc-500" : "text-zinc-400"
                            }`}
                          >
                            ≡
                          </span>
                          <span className="truncate">{customList.name}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          <span className={countBadgeClass(selected)}>
                            {customList._count.entries}
                          </span>
                          <span
                            aria-hidden="true"
                            title={dictionary.library.moreActionsComingSoon}
                            className={`opacity-0 transition-opacity group-hover:opacity-100 ${
                              selected ? "text-zinc-500" : "text-zinc-400"
                            }`}
                          >
                            …
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              )}
              <CustomListCreateForm />
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {dictionary.library.subscribedLists}
              </h2>
              <p className="rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-500">
                {dictionary.library.subscribedPlaceholder}
              </p>
            </section>
          </aside>

          <MyCollectionContent
            key={`${selectedTitle}:${serializedSelectedEntries
              .map((entry) => entry.id)
              .join(",")}`}
            selectedTitle={selectedTitle}
            entries={serializedSelectedEntries}
            customLists={customLists.map((customList) => ({
              id: customList.id,
              name: customList.name,
            }))}
            currentCustomListId={selectedCustomList?.id ?? null}
            emptyTitle={
              totalEntryCount === 0
                ? dictionary.library.emptyAllTitle
                : dictionary.library.emptyCollectionTitle
            }
            emptyDescription={
              totalEntryCount === 0
                ? dictionary.library.emptyAllDescription
                : dictionary.library.emptyCollectionDescription
            }
          />
        </div>
      </div>
    </PageShell>
  );
}
