import { api } from "@/services/api";
import { getMovieById } from "@/services/movie.service";
import { Movie } from "@/shared/types/movie";

export interface FavoriteMovie {
  id: string;
  movie_id: string;
  movie: Movie & { title?: string };
  created_at: string;
}

export interface FavoritesPage {
  items: FavoriteMovie[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface FavoriteMovieApiPayload {
  id?: string;
  movie_id?: string;
  movieId?: string;
  movie?: {
    id?: string;
    title?: string;
    title_uz?: string;
    title_ru?: string;
    title_en?: string;
    poster_url?: string;
    year?: number | null;
    duration_seconds?: number | null;
    imdb_rating?: number | string | null;
    age_rating?: number | null;
    views_count?: number | null;
  } | null;
  created_at?: string;
  createdAt?: string;
}

interface FavoritesListApiPayload {
  items?: FavoriteMovieApiPayload[];
  data?: FavoriteMovieApiPayload[];
  total?: number;
  page?: number;
  page_size?: number;
  pageSize?: number;
  has_next?: boolean;
  hasNext?: boolean;
}

const normalizeFavoriteMovie = (item: FavoriteMovieApiPayload): FavoriteMovie | null => {
  const movieId = item.movie_id ?? item.movieId ?? item.movie?.id;
  const entityId = item.id ?? movieId;
  const createdAt = item.created_at ?? item.createdAt ?? "";

  if (!movieId || !entityId) return null;

  const ratingRaw = item.movie?.imdb_rating;
  const rating =
    typeof ratingRaw === "number"
      ? String(ratingRaw)
      : typeof ratingRaw === "string"
        ? ratingRaw
        : undefined;

  return {
    id: entityId,
    movie_id: movieId,
    created_at: createdAt,
    movie: {
      id: item.movie?.id ?? movieId,
      title: item.movie?.title,
      title_uz: item.movie?.title_uz,
      title_ru: item.movie?.title_ru,
      title_en: item.movie?.title_en,
      poster_url: item.movie?.poster_url ?? "",
      year: item.movie?.year ?? undefined,
      duration_seconds: item.movie?.duration_seconds ?? undefined,
      imdb_rating: rating,
      age_rating: item.movie?.age_rating ?? undefined,
      views_count: item.movie?.views_count ?? undefined,
    },
  };
};

const hydrateMissingMovies = async (items: FavoriteMovie[]): Promise<FavoriteMovie[]> => {
  const indexesToHydrate = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.movie.poster_url || (!item.movie.title_uz && !item.movie.title_ru && !item.movie.title_en));

  if (indexesToHydrate.length === 0) return items;

  const hydrated = await Promise.all(
    indexesToHydrate.map(async ({ item, index }) => {
      try {
        const movie = await getMovieById(item.movie_id);
        if (!movie) return { index, item };
        return {
          index,
          item: {
            ...item,
            movie: {
              ...item.movie,
              ...movie,
              id: movie.id || item.movie.id || item.movie_id,
              poster_url: movie.poster_url || item.movie.poster_url || "",
            },
          },
        };
      } catch {
        return { index, item };
      }
    }),
  );

  const next = [...items];
  hydrated.forEach(({ index, item }) => {
    next[index] = item;
  });
  return next;
};

export const listFavoriteMovies = async (
  page = 1,
  pageSize = 20,
): Promise<FavoritesPage> => {
  const res = await api.get<ApiEnvelope<FavoritesListApiPayload>>("/api/v1/favorites/movies", {
    params: { page, page_size: pageSize },
  });

  if (!res.data?.success) {
    return { items: [], total: 0, page, page_size: pageSize, has_next: false };
  }

  const payload = res.data.data;
  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

  const normalizedItems = Array.isArray(rawItems)
    ? rawItems
        .map(normalizeFavoriteMovie)
        .filter((item): item is FavoriteMovie => item !== null)
    : [];
  const items = await hydrateMissingMovies(normalizedItems);

  return {
    items,
    total: payload?.total ?? items.length,
    page: payload?.page ?? page,
    page_size: payload?.page_size ?? payload?.pageSize ?? pageSize,
    has_next: Boolean(payload?.has_next ?? payload?.hasNext),
  };
};

export const checkFavoriteMovie = async (movieId: string): Promise<boolean> => {
  const res = await api.get<ApiEnvelope<{ is_favorite?: boolean }>>(
    `/api/v1/favorites/movies/${movieId}/check`,
  );
  if (!res.data?.success) return false;
  return Boolean(res.data.data?.is_favorite);
};

export const addFavoriteMovie = async (movieId: string): Promise<FavoriteMovie | null> => {
  const res = await api.post<ApiEnvelope<FavoriteMovieApiPayload>>(
    `/api/v1/favorites/movies/${movieId}`,
  );
  if (!res.data?.success) return null;
  return normalizeFavoriteMovie(res.data.data);
};

export const removeFavoriteMovie = async (movieId: string): Promise<boolean> => {
  const res = await api.delete(`/api/v1/favorites/movies/${movieId}`);
  return res.status >= 200 && res.status < 300;
};
