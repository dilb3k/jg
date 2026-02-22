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

export const getContinueWatching = async (): Promise<WatchHistoryItem[]> => {
  const res = await api.get<ApiResponse<WatchHistoryItem[]>>(
    "/api/v1/history/continue-watching?limit=10",
  );
  if (!res.data?.success) return [];
  return Array.isArray(res.data.data) ? res.data.data : [];
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
