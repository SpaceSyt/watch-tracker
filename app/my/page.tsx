import { redirect } from "next/navigation";
import Link from "next/link";
import { EntryStatus } from "@/app/generated/prisma/enums";
import { AddTitleButtons } from "@/components/add-title-buttons";
import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const statusGroups = [
  { status: EntryStatus.PLAN_TO_WATCH, label: "Plan to Watch" },
  { status: EntryStatus.WATCHING, label: "Watching" },
  { status: EntryStatus.COMPLETED, label: "Completed" },
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
  } = await supabase.auth.getUser();
  const userEmail = user?.email ?? "Signed-in user";
  const userProfile = user
    ? await prisma.userProfile.findUnique({
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
      })
    : null;
  const entries = userProfile?.entries ?? [];

  return (
    <PageShell
      eyebrow="Library"
      title="My List"
      description="Your saved titles grouped by watch status."
    >
      <div className="grid gap-5">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-sm text-zinc-500">Authenticated user</p>
          <p className="mt-2 text-base font-medium text-zinc-900">{userEmail}</p>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-600">
              No titles saved yet. Search for a title and add it to your list.
            </p>
            <Link
              href="/search"
              className="mt-4 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Go to Search
            </Link>
          </div>
        ) : null}

        <div className="grid gap-5">
          {statusGroups.map((group) => {
            const groupEntries = entries.filter(
              (entry) => entry.status === group.status,
            );

            return (
              <section key={group.status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-950">
                    {group.label}
                  </h2>
                  <span className="text-sm text-zinc-500">
                    {groupEntries.length}
                  </span>
                </div>

                {groupEntries.length === 0 ? (
                  <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                    No titles in this group.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {groupEntries.map((entry) => (
                      <article
                        key={entry.id}
                        className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-[72px_1fr]"
                      >
                        <Link
                          href={`/title/${entry.title.externalSource}/${getMediaTypePath(entry.title.mediaType)}/${entry.title.externalId}`}
                          className="flex h-28 w-[72px] items-center justify-center overflow-hidden rounded-md bg-zinc-200 text-xs text-zinc-500"
                        >
                          {entry.title.posterUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={entry.title.posterUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            "No poster"
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
                              <span className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600">
                                {entry.status}
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
                          {isTmdbListMediaType(entry.title.mediaType) ? (
                            <AddTitleButtons
                              source="tmdb"
                              externalId={entry.title.externalId}
                              mediaType={entry.title.mediaType}
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
