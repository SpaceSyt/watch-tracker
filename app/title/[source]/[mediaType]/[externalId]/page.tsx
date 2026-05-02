import { notFound } from "next/navigation";
import { AddTitleButtons } from "@/components/add-title-buttons";
import { PageShell } from "@/components/page-shell";
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
        description={titleResult.error ?? "Unable to load this title."}
      />
    );
  }

  const { title } = titleResult;

  return (
    <PageShell
      eyebrow={`${title.mediaType} / ${getYear(title.releaseDate)}`}
      title={title.title}
      description={title.description || "No description available."}
    >
      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <div className="flex h-[270px] w-[180px] items-center justify-center overflow-hidden rounded-md bg-zinc-200 text-sm text-zinc-500">
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
        <div className="space-y-5">
          <dl className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
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

          <AddTitleButtons
            source="tmdb"
            externalId={title.externalId}
            mediaType={title.mediaType}
          />
        </div>
      </div>
    </PageShell>
  );
}
