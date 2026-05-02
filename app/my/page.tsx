import { redirect } from "next/navigation";
import Link from "next/link";
import { EntryStatus } from "@/app/generated/prisma/enums";
import { AddTitleButtons } from "@/components/add-title-buttons";
import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const statusGroups = [
  {
    status: EntryStatus.PLAN_TO_WATCH,
    label: "Plan to Watch",
    description: "Titles you want to start later.",
  },
  {
    status: EntryStatus.WATCHING,
    label: "Watching",
    description: "Titles currently in progress.",
  },
  {
    status: EntryStatus.COMPLETED,
    label: "Completed",
    description: "Titles you have finished.",
  },
];

function getYear(releaseDate: Date | null) {
  return releaseDate ? String(releaseDate.getUTCFullYear()) : "Unknown year";
}

function getMediaTypePath(mediaType: string) {
  return mediaType.toLowerCase();
}

function isTmdbListMediaType(mediaType: string): mediaType is "MOVIE" | "TV" {
  return mediaType === "MOVIE" || mediaType === "TV";
}

function formatUpdatedAt(updatedAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(updatedAt);
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

export default async function MyListPage() {
  if (!hasSupabaseEnv()) {
    return (
      <PageShell
        eyebrow="Library"
        title="My List"
        description="Supabase environment variables are not configured yet. Add them before testing the protected page."
      />
    );
  }

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
      entries: {
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          title: true,
        },
      },
    },
  });
  const entries = userProfile?.entries ?? [];

  return (
    <PageShell
      eyebrow="Library"
      title="My List"
      description="Your saved titles, grouped by watch status and sorted by recent updates."
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

        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-zinc-950">
              Your list is empty
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
              Search for a movie or TV title, open its detail page, and choose a
              watch status to start building your list.
            </p>
            <Link
              href="/search"
              className="mt-5 inline-flex rounded-md border border-zinc-300 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Search titles
            </Link>
          </div>
        ) : null}

        <div className="grid gap-7">
          {statusGroups.map((group) => {
            const groupEntries = entries.filter(
              (entry) => entry.status === group.status,
            );

            return (
              <section key={group.status} className="space-y-4">
                <div className="flex items-end justify-between gap-4 border-b border-zinc-200 pb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-950">
                      {group.label}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {group.description}
                    </p>
                  </div>
                  <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-600">
                    {groupEntries.length}
                  </span>
                </div>

                {groupEntries.length === 0 ? (
                  <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500">
                    No titles in this group.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {groupEntries.map((entry) => (
                      <article
                        key={entry.id}
                        className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-[88px_1fr]"
                      >
                        <Link
                          href={`/title/${entry.title.externalSource}/${getMediaTypePath(entry.title.mediaType)}/${entry.title.externalId}`}
                          className="flex h-32 w-[88px] items-center justify-center overflow-hidden rounded-md bg-zinc-100 text-center text-xs font-medium text-zinc-400"
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
                        <div className="min-w-0 space-y-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/title/${entry.title.externalSource}/${getMediaTypePath(entry.title.mediaType)}/${entry.title.externalId}`}
                                className="font-semibold text-zinc-950 hover:underline"
                              >
                                {entry.title.title}
                              </Link>
                              <span className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700">
                                {formatStatus(entry.status)}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {entry.title.mediaType} / {getYear(entry.title.releaseDate)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-zinc-500">
                              Updated {formatUpdatedAt(entry.updatedAt)}
                            </p>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">
                              {entry.title.description ||
                                "No description available."}
                            </p>
                          </div>
                          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                            <p className="font-medium text-zinc-900">
                              Your rating:{" "}
                              {entry.rating ? `${entry.rating}/10` : "Not rated"}
                            </p>
                            {entry.review ? (
                              <p className="mt-2 leading-6 text-zinc-600">
                                {entry.review}
                              </p>
                            ) : (
                              <p className="mt-2 text-zinc-500">
                                No review yet.
                              </p>
                            )}
                          </div>
                          {isTmdbListMediaType(entry.title.mediaType) ? (
                            <AddTitleButtons
                              source="tmdb"
                              externalId={entry.title.externalId}
                              mediaType={entry.title.mediaType}
                              entryId={entry.id}
                              initialRating={entry.rating}
                              initialReview={entry.review}
                              showRatingReview
                            />
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
