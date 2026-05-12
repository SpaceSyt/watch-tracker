import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import {
  maxTmdbSearchPage,
  maxTmdbSearchQueryLength,
  searchTmdbTitles,
} from "@/lib/tmdb";

type SearchPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
};

function getYear(releaseDate: string | null) {
  return releaseDate ? releaseDate.slice(0, 4) : "Unknown year";
}

function getMediaTypePath(mediaType: "MOVIE" | "TV") {
  return mediaType.toLowerCase();
}

function getMediaTypeLabel(mediaType: "MOVIE" | "TV") {
  return mediaType === "MOVIE" ? "Movie" : "TV";
}

function parseSearchPage(value: string | undefined) {
  if (!value) {
    return 1;
  }

  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return Math.min(page, maxTmdbSearchPage);
}

function getSearchPageHref(query: string, page: number) {
  const params = new URLSearchParams({
    q: query,
  });

  if (page > 1) {
    params.set("page", String(page));
  }

  return `/search?${params.toString()}`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { page, q } = await searchParams;
  const query = q?.trim() ?? "";
  const requestedPage = parseSearchPage(page);
  let searchResult: Awaited<ReturnType<typeof searchTmdbTitles>> = {
    results: [],
    page: requestedPage,
    totalPages: 0,
    totalResults: 0,
  };
  let errorMessage: string | null = null;

  if (query.length > maxTmdbSearchQueryLength) {
    errorMessage = `Search query must be ${maxTmdbSearchQueryLength} characters or fewer.`;
  } else if (query) {
    try {
      searchResult = await searchTmdbTitles(query, requestedPage);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Unable to search TMDB.";
    }
  }

  const results = searchResult.results;
  const hasPreviousPage = Boolean(
    query && !errorMessage && searchResult.page > 1,
  );
  const hasNextPage = Boolean(
    query && !errorMessage && searchResult.page < searchResult.totalPages,
  );

  return (
    <PageShell
      eyebrow="Explore"
      title="Search"
      description="Find movies and TV titles from TMDB, then open a result to add it to your list."
    >
      <div className="space-y-6">
        <form
          action="/search"
          className="flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor="search-query">
            Search query
          </label>
          <input
            id="search-query"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search movies or TV..."
            maxLength={maxTmdbSearchQueryLength}
            className="min-h-11 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-base text-zinc-900 outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            className="min-h-11 rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Search
          </button>
        </form>

        {errorMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {!query ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
            <h2 className="text-base font-semibold text-zinc-950">No results</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Enter a title to search TMDB for movies and TV shows.
            </p>
          </div>
        ) : null}

        {query && !errorMessage ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-zinc-600">
                Results for <span className="text-zinc-950">{query}</span>
              </h2>
              <span className="text-sm text-zinc-500">
                {searchResult.totalResults} found
                {searchResult.totalPages > 1
                  ? ` · Page ${searchResult.page} of ${searchResult.totalPages}`
                  : ""}
              </span>
            </div>

            {results.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
                <h2 className="text-base font-semibold text-zinc-950">
                  No results
                </h2>
                <p className="mt-2 text-sm text-zinc-600">
                  Try a different movie or TV title.
                </p>
              </div>
            ) : (
              results.map((result) => (
                <Link
                  key={`${result.externalSource}-${result.externalId}-${result.mediaType}`}
                  href={`/title/${result.externalSource}/${getMediaTypePath(result.mediaType)}/${result.externalId}`}
                  className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 sm:grid-cols-[96px_1fr]"
                >
                  <div className="flex h-36 w-24 items-center justify-center overflow-hidden rounded-md bg-zinc-100 text-center text-xs font-medium text-zinc-400">
                    {result.posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={result.posterUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>No poster</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-zinc-950">
                        {result.title}
                      </h2>
                      <span className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600">
                        {getMediaTypeLabel(result.mediaType)}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {getYear(result.releaseDate)}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
                      {result.description || "No overview available."}
                    </p>
                  </div>
                </Link>
              ))
            )}

            {hasPreviousPage || hasNextPage ? (
              <nav
                aria-label="Search result pages"
                className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4"
              >
                {hasPreviousPage ? (
                  <Link
                    href={getSearchPageHref(query, searchResult.page - 1)}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                {hasNextPage ? (
                  <Link
                    href={getSearchPageHref(query, searchResult.page + 1)}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Next
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
