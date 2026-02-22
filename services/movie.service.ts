import { api } from "@/services/api";
import { Movie } from "@/shared/types/movie";

export interface MovieDetail extends Movie {
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
}

interface MovieResponse {
  success: boolean;
  data: MovieDetail;
}

export const getMovieById = async (id: string): Promise<MovieDetail | null> => {
  const res = await api.get<MovieResponse>(`/api/v1/movies/${id}`);
  if (!res.data?.success) return null;
  return res.data.data;
};
