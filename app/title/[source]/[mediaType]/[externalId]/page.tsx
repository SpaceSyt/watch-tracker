import { notFound } from "next/navigation";
import { EntryStatus } from "@/app/generated/prisma/enums";
import { AddTitleButtons } from "@/components/add-title-buttons";
import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/prisma";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getTmdbTitleDetails } from "@/lib/tmdb";

type TitlePageProps = {
  params: Promise<{
    source: string;
    mediaType: string;
    externalId: string;
  }>;
};

function parseMediaType(value: string) {
  if (value === "movie") {
    return "MOVIE";
  }

  if (value === "tv") {
    return "TV";
  }

  return null;
}

function getYear(releaseDate: string | null) {
  return releaseDate ? releaseDate.slice(0, 4) : "Unknown year";
}

function canEditRatingReview(status: EntryStatus) {
  return status === EntryStatus.WATCHING || status === EntryStatus.COMPLETED;
}

async function getSavedTitleEntry(source: string, externalId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return prisma.userTitleEntry.findFirst({
    where: {
      user: {
        authUserId: user.id,
      },
      title: {
        externalSource: source,
        externalId,
      },
    },
    select: {
      id: true,
      status: true,
      rating: true,
      review: true,
    },
  });
}

export default async function TitlePage({ params }: TitlePageProps) {
  const { source, mediaType, externalId } = await params;
  const parsedMediaType = parseMediaType(mediaType);

  if (source !== "tmdb" || !parsedMediaType) {
    notFound();
  }

  const titleResult = await getTmdbTitleDetails(parsedMediaType, externalId)
    .then((title) => ({ title, error: null }))
    .catch((error: unknown) => ({
      title: null,
      error:
        error instanceof Error ? error.message : "Unable to load this title.",
    }));

  if (titleResult.error || !titleResult.title) {
    return (
      <PageShell
        eyebrow="Title"
        title="Title not found"
        description="The title could not be loaded from TMDB."
      >
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {titleResult.error ?? "Unable to load this title."}
        </div>
      </PageShell>
    );
  }

  const { title } = titleResult;
  const savedEntry = await getSavedTitleEntry(source, title.externalId);
  const showRatingReview =
    savedEntry !== null && canEditRatingReview(savedEntry.status);

  return (
    <PageShell
      eyebrow="Title"
      title={title.title}
      description={`${title.mediaType} / ${getYear(title.releaseDate)}`}
    >
      <div className="grid gap-7 md:grid-cols-[220px_1fr]">
        <div className="flex h-[330px] w-[220px] items-center justify-center overflow-hidden rounded-md bg-zinc-100 text-sm font-medium text-zinc-400">
          {title.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={title.posterUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            "No poster"
          )}
        </div>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600">
              {title.mediaType === "MOVIE" ? "Movie" : "TV"}
            </span>
            <span className="text-sm text-zinc-500">
              {getYear(title.releaseDate)}
            </span>
            <span className="text-sm text-zinc-500">tmdb / {title.externalId}</span>
          </div>

          <p className="max-w-3xl text-base leading-7 text-zinc-700">
            {title.description || "No description available."}
          </p>

          <dl className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-900">Original title</dt>
              <dd>{title.originalTitle || title.title}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">External source</dt>
              <dd>tmdb / {title.externalId}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Release date</dt>
              <dd>{title.releaseDate || "Unknown"}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Total episodes</dt>
              <dd>{title.totalEpisodes ?? "N/A"}</dd>
            </div>
          </dl>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-zinc-950">
              Add to your list
            </h2>
            <div className="mt-3">
              <AddTitleButtons
                source="tmdb"
                externalId={title.externalId}
                mediaType={title.mediaType}
                entryId={savedEntry?.id}
                currentStatus={savedEntry?.status}
                initialRating={savedEntry?.rating}
                initialReview={savedEntry?.review}
                showRatingReview={showRatingReview}
              />
            </div>
            {savedEntry?.status === EntryStatus.PLAN_TO_WATCH ? (
              <p className="mt-3 text-sm text-zinc-500">
                Ratings and reviews are available after moving this title to
                Watching or Completed.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
