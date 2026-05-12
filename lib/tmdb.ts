type TmdbMediaType = "movie" | "tv" | "person";

type TmdbSearchResult = {
  id: number;
  media_type: TmdbMediaType;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
};

type TmdbSearchResponse = {
  page?: number;
  results?: TmdbSearchResult[];
  total_pages?: number;
  total_results?: number;
};

type TmdbMovieDetails = {
  id: number;
  title?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
};

type TmdbTvDetails = {
  id: number;
  name?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  number_of_episodes?: number | null;
};

export type NormalizedTmdbTitle = {
  externalSource: "tmdb";
  externalId: string;
  mediaType: "MOVIE" | "TV";
  title: string;
  originalTitle: string | null;
  description: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  totalEpisodes: null;
};

export type NormalizedTmdbTitleDetails = Omit<
  NormalizedTmdbTitle,
  "totalEpisodes"
> & {
  totalEpisodes: number | null;
};

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export const maxTmdbSearchQueryLength = 100;
export const maxTmdbExternalIdLength = 20;
export const maxTmdbSearchPage = 500;

const tmdbExternalIdPattern = new RegExp(
  `^\\d{1,${maxTmdbExternalIdLength}}$`,
);

export function isValidTmdbExternalId(value: string) {
  return tmdbExternalIdPattern.test(value);
}

function normalizeSearchPage(page: number) {
  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return Math.min(page, maxTmdbSearchPage);
}

function getTmdbConfig() {
  const accessToken = process.env.TMDB_ACCESS_TOKEN?.trim() || null;
  const apiKey = process.env.TMDB_API_KEY?.trim() || null;

  if (!accessToken && !apiKey) {
    throw new Error(
      "Missing TMDB environment variable. Set TMDB_ACCESS_TOKEN or TMDB_API_KEY.",
    );
  }

  return { accessToken, apiKey };
}

function buildImageUrl(path: string | null | undefined) {
  return path ? `${TMDB_IMAGE_BASE_URL}${path}` : null;
}

async function fetchTmdbJson<T>(path: string, searchParams?: URLSearchParams) {
  const { accessToken, apiKey } = getTmdbConfig();
  const url = new URL(`${TMDB_BASE_URL}${path}`);

  if (searchParams) {
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const headers: HeadersInit = {
    accept: "application/json",
  };

  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  } else if (apiKey) {
    url.searchParams.set("api_key", apiKey);
  }

  const response = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

function normalizeTmdbTitle(result: TmdbSearchResult): NormalizedTmdbTitle | null {
  if (result.media_type === "movie") {
    const title = result.title?.trim();

    if (!title) {
      return null;
    }

    return {
      externalSource: "tmdb",
      externalId: String(result.id),
      mediaType: "MOVIE",
      title,
      originalTitle: result.original_title?.trim() || null,
      description: result.overview?.trim() || null,
      posterUrl: buildImageUrl(result.poster_path),
      backdropUrl: buildImageUrl(result.backdrop_path),
      releaseDate: result.release_date || null,
      totalEpisodes: null,
    };
  }

  if (result.media_type === "tv") {
    const title = result.name?.trim();

    if (!title) {
      return null;
    }

    return {
      externalSource: "tmdb",
      externalId: String(result.id),
      mediaType: "TV",
      title,
      originalTitle: result.original_name?.trim() || null,
      description: result.overview?.trim() || null,
      posterUrl: buildImageUrl(result.poster_path),
      backdropUrl: buildImageUrl(result.backdrop_path),
      releaseDate: result.first_air_date || null,
      totalEpisodes: null,
    };
  }

  return null;
}

export type NormalizedTmdbSearchPage = {
  results: NormalizedTmdbTitle[];
  page: number;
  totalPages: number;
  totalResults: number;
};

export async function searchTmdbTitles(
  query: string,
  page = 1,
): Promise<NormalizedTmdbSearchPage> {
  const trimmedQuery = query.trim();
  const searchPage = normalizeSearchPage(page);

  if (!trimmedQuery) {
    return {
      results: [],
      page: 1,
      totalPages: 0,
      totalResults: 0,
    };
  }

  if (trimmedQuery.length > maxTmdbSearchQueryLength) {
    throw new Error(
      `Search query must be ${maxTmdbSearchQueryLength} characters or fewer.`,
    );
  }

  const searchParams = new URLSearchParams({
    query: trimmedQuery,
    include_adult: "false",
    language: "en-US",
    page: String(searchPage),
  });
  const data = await fetchTmdbJson<TmdbSearchResponse>(
    "/search/multi",
    searchParams,
  );

  const results = (data.results ?? [])
    .map(normalizeTmdbTitle)
    .filter((title): title is NormalizedTmdbTitle => Boolean(title));

  return {
    results,
    page: normalizeSearchPage(data.page ?? searchPage),
    totalPages: Math.min(data.total_pages ?? 0, maxTmdbSearchPage),
    totalResults: data.total_results ?? results.length,
  };
}

export async function getTmdbTitleDetails(
  mediaType: "MOVIE" | "TV",
  externalId: string,
): Promise<NormalizedTmdbTitleDetails> {
  if (!isValidTmdbExternalId(externalId)) {
    throw new Error("Invalid TMDB title id.");
  }

  if (mediaType === "MOVIE") {
    const movie = await fetchTmdbJson<TmdbMovieDetails>(`/movie/${externalId}`);
    const title = movie.title?.trim();

    if (!title) {
      throw new Error("TMDB movie response did not include a title.");
    }

    return {
      externalSource: "tmdb",
      externalId: String(movie.id),
      mediaType: "MOVIE",
      title,
      originalTitle: movie.original_title?.trim() || null,
      description: movie.overview?.trim() || null,
      posterUrl: buildImageUrl(movie.poster_path),
      backdropUrl: buildImageUrl(movie.backdrop_path),
      releaseDate: movie.release_date || null,
      totalEpisodes: null,
    };
  }

  const tv = await fetchTmdbJson<TmdbTvDetails>(`/tv/${externalId}`);
  const title = tv.name?.trim();

  if (!title) {
    throw new Error("TMDB TV response did not include a title.");
  }

  return {
    externalSource: "tmdb",
    externalId: String(tv.id),
    mediaType: "TV",
    title,
    originalTitle: tv.original_name?.trim() || null,
    description: tv.overview?.trim() || null,
    posterUrl: buildImageUrl(tv.poster_path),
    backdropUrl: buildImageUrl(tv.backdrop_path),
    releaseDate: tv.first_air_date || null,
    totalEpisodes: tv.number_of_episodes ?? null,
  };
}
