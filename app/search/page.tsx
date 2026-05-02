import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { searchTmdbTitles } from "@/lib/tmdb";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

function getYear(releaseDate: string | null) {
  return releaseDate ? releaseDate.slice(0, 4) : "Unknown year";
}

function getMediaTypePath(mediaType: "MOVIE" | "TV") {
  return mediaType.toLowerCase();
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  let results: Awaited<ReturnType<typeof searchTmdbTitles>> = [];
  let errorMessage: string | null = null;

  if (query) {
    try {
      results = await searchTmdbTitles(query);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Unable to search TMDB.";
    }
  }

  return (
    <PageShell
      eyebrow="Explore"
      title="Search"
      description="Search TMDB for movies and TV titles, then open a result to add it to your list."
    >
      <form action="/search" className="flex max-w-2xl gap-3">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search movies or TV..."
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
        />
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          Search
        </button>
      </form>

      {errorMessage ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {!query ? (
        <p className="mt-6 text-sm text-zinc-600">
          No results. Enter a search query to find movies and TV titles.
        </p>
      ) : null}

      {query && !errorMessage ? (
        <div className="mt-8 grid gap-4">
          {results.length === 0 ? (
            <p className="text-sm text-zinc-600">No movie or TV results found.</p>
          ) : (
            results.map((result) => (
              <Link
                key={`${result.externalSource}-${result.externalId}-${result.mediaType}`}
                href={`/title/${result.externalSource}/${getMediaTypePath(result.mediaType)}/${result.externalId}`}
                className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 hover:bg-zinc-100 sm:grid-cols-[92px_1fr]"
              >
                <div className="flex h-32 w-[92px] items-center justify-center overflow-hidden rounded-md bg-zinc-200 text-xs text-zinc-500">
                  {result.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.posterUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "No poster"
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-zinc-950">
                      {result.title}
                    </h2>
                    <span className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600">
                      {result.mediaType}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {getYear(result.releaseDate)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">
                    {result.description || "No description available."}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </PageShell>
  );
}
