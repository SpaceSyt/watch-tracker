import { redirect } from "next/navigation";
import Link from "next/link";
import { EntryStatus } from "@/app/generated/prisma/enums";
import { CustomListCreateForm } from "@/components/custom-list-create-form";
import { MyCollectionContent } from "@/components/my-collection-content";
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
    key: "plan-to-watch",
    status: EntryStatus.PLAN_TO_WATCH,
    label: "Plan to Watch",
    description: "Titles you want to start later.",
  },
  {
    key: "watching",
    status: EntryStatus.WATCHING,
    label: "Watching",
    description: "Titles currently in progress.",
  },
  {
    key: "completed",
    status: EntryStatus.COMPLETED,
    label: "Completed",
    description: "Titles you have finished.",
  },
] as const;

const defaultSystemCollectionKey = "watching";

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
            createdAt: "asc",
          },
          {
            name: "asc",
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
        systemCollections.find(
          (collection) => collection.key === defaultSystemCollectionKey,
        ) ??
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
    : selectedSystemCollection?.label ??
      systemCollections.find(
        (collection) => collection.key === defaultSystemCollectionKey,
      )?.label ??
      systemCollections[0].label;
  const serializedSelectedEntries = selectedEntries.map((entry) => ({
    ...entry,
    updatedAt: entry.updatedAt.toISOString(),
    title: {
      ...entry.title,
      releaseDate: entry.title.releaseDate?.toISOString() ?? null,
    },
  }));

  return (
    <PageShell
      eyebrow="Library"
      title="My List"
      description="Browse status collections and user-created custom lists in a compact collection hub."
      wide
    >
      <div className="grid gap-5">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
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

        <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
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
                  No custom lists yet.
                </p>
              ) : (
                <nav className="grid gap-2" aria-label="User custom lists">
                  {customLists.map((customList) => {
                    const selected = selectedCustomList?.id === customList.id;

                    return (
                      <Link
                        key={customList.id}
                        href={`/my?list=${encodeURIComponent(customList.id)}`}
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
              <CustomListCreateForm />
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
            emptyTitle={
              entries.length === 0
                ? "Your list is empty"
                : "No titles in this collection"
            }
            emptyDescription={
              entries.length === 0
                ? "Search for a movie or TV title, open its detail page, and choose a watch status to start building your list."
                : "Add or assign saved titles from their title detail pages."
            }
          />
        </div>
      </div>
    </PageShell>
  );
}
