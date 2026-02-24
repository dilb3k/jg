import { api } from "@/services/api";
import { Movie } from "@/shared/types/movie";
import { WatchHistoryItem } from "@/shared/types/watch-history";

export interface Carousel {
  id: string;
  poster_url: string;
  movie: Movie;
}

export interface Genre {
  id: string;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface GenresPayload {
  items?: Genre[];
}

type RawWatchHistoryItem = {
  type?: "movie" | "episode";
  id?: string;
  content_id?: string;
  title_uz?: string;
  title_ru?: string;
  title_en?: string;
  series_title_uz?: string | null;
  series_title_ru?: string | null;
  series_title_en?: string | null;
  season_number?: number | null;
  episode_number?: number | null;
  poster_url?: string;
  last_position_seconds?: number;
  total_duration_seconds?: number;
  progress_percent?: number;
  imdb_rating?: string | number | null;
};

export const getCarousels = async (): Promise<Carousel[]> => {
  const res = await api.get<ApiResponse<Carousel[]>>("/api/v1/carousels");
  if (!res.data?.success) return [];
  return Array.isArray(res.data.data) ? res.data.data : [];
};

export const getGenres = async (): Promise<Genre[]> => {
  const res = await api.get<ApiResponse<GenresPayload>>("/api/v1/movies/genres");
  if (!res.data?.success) return [];
  return Array.isArray(res.data.data?.items) ? res.data.data.items : [];
};

export const getPopularMovies = async (page = 1, perPage = 20): Promise<Movie[]> => {
  const res = await api.get<ApiResponse<Movie[]>>(`/api/v1/movies/popular?page=${page}&per_page=${perPage}`);
  if (!res.data?.success) return [];
  return Array.isArray(res.data.data) ? res.data.data : [];
};

export const getLatestMovies = async (page = 1, perPage = 20): Promise<Movie[]> => {
  const res = await api.get<ApiResponse<Movie[]>>(`/api/v1/movies/latest?page=${page}&per_page=${perPage}`);
  if (!res.data?.success) return [];
  return Array.isArray(res.data.data) ? res.data.data : [];
};

export const getContinueWatching = async (): Promise<WatchHistoryItem[]> => {
  const res = await api.get<ApiResponse<RawWatchHistoryItem[]>>("/api/v1/history/continue-watching?limit=10");
  if (!res.data?.success) return [];

  if (!Array.isArray(res.data.data)) return [];

  return res.data.data
    .map((item): WatchHistoryItem | null => {
      const contentId = item.content_id;
      const posterUrl = item.poster_url;
      if (!contentId || !posterUrl || !item.id) return null;

      return {
        type: (item.type ?? "movie") as WatchHistoryItem["type"],
        id: item.id,
        content_id: contentId,
        title_uz: item.title_uz,
        title_ru: item.title_ru,
        title_en: item.title_en,
        series_title_uz: item.series_title_uz ?? undefined,
        series_title_ru: item.series_title_ru ?? undefined,
        series_title_en: item.series_title_en ?? undefined,
        season_number: item.season_number ?? undefined,
        episode_number: item.episode_number ?? undefined,
        poster_url: posterUrl,
        imdb_rating:
          typeof item.imdb_rating === "number"
            ? String(item.imdb_rating)
            : (item.imdb_rating ?? undefined),
        last_position_seconds: item.last_position_seconds ?? 0,
        total_duration_seconds: item.total_duration_seconds ?? 0,
        progress_percent: item.progress_percent ?? 0,
      };
    })
    .filter((item): item is WatchHistoryItem => item !== null);
};

export const getMoviesByGenre = async (
  genreId: string,
  page = 1,
  perPage = 20,
): Promise<Movie[]> => {
  const res = await api.get<ApiResponse<Movie[] | { items?: Movie[] }>>(
    `/api/v1/movies/by-genre/${genreId}?page=${page}&per_page=${perPage}`,
  );
  if (!res.data?.success) return [];

  const payload = res.data.data;
  return Array.isArray(payload) ? payload : (payload?.items ?? []);
};
