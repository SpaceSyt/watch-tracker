import Image from "next/image";
import { notFound } from "next/navigation";
import { EntryStatus } from "@/app/generated/prisma/enums";
import { AddTitleButtons } from "@/components/add-title-buttons";
import { CustomListAssignmentForm } from "@/components/custom-list-assignment-form";
import { EpisodeProgressForm } from "@/components/episode-progress-form";
import { PageShell } from "@/components/page-shell";
import { listCustomListsForUser } from "@/lib/custom-lists";
import { getServerDictionary } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getTmdbTitleDetails, isValidTmdbExternalId } from "@/lib/tmdb";

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

function getYear(releaseDate: string | null, unknownYear: string) {
  return releaseDate ? releaseDate.slice(0, 4) : unknownYear;
}

function canEditRatingReview(status: EntryStatus) {
  return status === EntryStatus.WATCHING || status === EntryStatus.COMPLETED;
}

function canEditEpisodeProgress(status: EntryStatus, mediaType: "MOVIE" | "TV") {
  return (
    mediaType === "TV" &&
    (status === EntryStatus.WATCHING || status === EntryStatus.COMPLETED)
  );
}

async function getSavedTitleEntry(
  source: string,
  externalId: string,
  mediaType: "MOVIE" | "TV",
) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const user = await getAuthenticatedUser();

  if (!user) {
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
        mediaType,
      },
    },
    select: {
      id: true,
      userId: true,
      status: true,
      rating: true,
      review: true,
      progressCurrent: true,
      customListEntries: {
        select: {
          listId: true,
        },
      },
      title: {
        select: {
          totalEpisodes: true,
        },
      },
    },
  });
}

export default async function TitlePage({ params }: TitlePageProps) {
  const dictionary = await getServerDictionary();
  const { source, mediaType, externalId } = await params;
  const parsedMediaType = parseMediaType(mediaType);

  if (
    source !== "tmdb" ||
    !parsedMediaType ||
    !isValidTmdbExternalId(externalId)
  ) {
    notFound();
  }

  const [titleResult, savedEntry] = await Promise.all([
    getTmdbTitleDetails(parsedMediaType, externalId)
      .then((title) => ({ title, error: null }))
      .catch((error: unknown) => ({
        title: null,
        error:
          error instanceof Error ? error.message : dictionary.titlePage.unable,
      })),
    getSavedTitleEntry(source, externalId, parsedMediaType),
  ]);

  if (titleResult.error || !titleResult.title) {
    return (
      <PageShell
        eyebrow={dictionary.titlePage.eyebrow}
        title={dictionary.titlePage.notFoundTitle}
        description={dictionary.titlePage.notFoundDescription}
      >
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {titleResult.error ?? dictionary.titlePage.unable}
        </div>
      </PageShell>
    );
  }

  const { title } = titleResult;
  const customLists = savedEntry
    ? await listCustomListsForUser({ userId: savedEntry.userId })
    : [];
  const selectedCustomListIds =
    savedEntry?.customListEntries.map((entry) => entry.listId) ?? [];
  const showRatingReview =
    savedEntry !== null && canEditRatingReview(savedEntry.status);
  const showEpisodeProgress =
    savedEntry !== null &&
    canEditEpisodeProgress(savedEntry.status, title.mediaType);
  const savedTotalEpisodes = savedEntry?.title.totalEpisodes ?? null;

  return (
    <PageShell
      eyebrow={dictionary.titlePage.eyebrow}
      title={title.title}
      description={`${
        title.mediaType === "MOVIE" ? dictionary.common.movie : dictionary.common.tv
      } / ${getYear(title.releaseDate, dictionary.common.unknownYear)}`}
    >
      <div className="grid gap-7 md:grid-cols-[220px_1fr]">
        <div className="flex h-[330px] w-[220px] items-center justify-center overflow-hidden rounded-md bg-zinc-100 text-sm font-medium text-zinc-400">
          {title.posterUrl ? (
            <Image
              src={title.posterUrl}
              alt=""
              width={220}
              height={330}
              sizes="220px"
              className="h-full w-full object-cover"
            />
          ) : (
            dictionary.common.noPoster
          )}
        </div>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600">
              {title.mediaType === "MOVIE"
                ? dictionary.common.movie
                : dictionary.common.tv}
            </span>
            <span className="text-sm text-zinc-500">
              {getYear(title.releaseDate, dictionary.common.unknownYear)}
            </span>
            <span className="text-sm text-zinc-500">tmdb / {title.externalId}</span>
          </div>

          <p className="max-w-3xl text-base leading-7 text-zinc-700">
            {title.description || dictionary.common.noDescription}
          </p>

          <dl className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-900">
                {dictionary.titlePage.originalTitle}
              </dt>
              <dd>{title.originalTitle || title.title}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">
                {dictionary.titlePage.externalSource}
              </dt>
              <dd>tmdb / {title.externalId}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">
                {dictionary.titlePage.releaseDate}
              </dt>
              <dd>{title.releaseDate || dictionary.common.unknown}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">
                {dictionary.titlePage.totalEpisodes}
              </dt>
              <dd>{title.totalEpisodes ?? dictionary.common.notAvailable}</dd>
            </div>
          </dl>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-zinc-950">
              {dictionary.titlePage.addToYourList}
            </h2>
            <div className="mt-3 space-y-3">
              <AddTitleButtons
                source="tmdb"
                externalId={title.externalId}
                mediaType={title.mediaType}
                entryId={savedEntry?.id}
                currentStatus={savedEntry?.status}
                initialRating={savedEntry?.rating}
                initialReview={savedEntry?.review}
                showRatingReview={showRatingReview}
                statusAction={
                  savedEntry ? (
                    <CustomListAssignmentForm
                      entryId={savedEntry.id}
                      source="tmdb"
                      externalId={title.externalId}
                      mediaType={title.mediaType}
                      customLists={customLists.map((customList) => ({
                        id: customList.id,
                        name: customList.name,
                      }))}
                      selectedListIds={selectedCustomListIds}
                    />
                  ) : null
                }
              />
              {showEpisodeProgress ? (
                <EpisodeProgressForm
                  entryId={savedEntry.id}
                  initialProgressCurrent={savedEntry.progressCurrent}
                  totalEpisodes={savedTotalEpisodes}
                />
              ) : null}
              {!savedEntry ? (
                <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
                  {dictionary.titlePage.saveBeforeCustomLists}
                </p>
              ) : null}
            </div>
            {savedEntry?.status === EntryStatus.PLAN_TO_WATCH ? (
              <p className="mt-3 text-sm text-zinc-500">
                {dictionary.titlePage.feedbackAvailable}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
