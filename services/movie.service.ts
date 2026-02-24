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

export interface StreamTrack {
  id?: string;
  language?: string;
  file_url?: string;
}

export interface MovieStreamPayload {
  movie_id: string;
  title?: string;
  stream_url: string;
  expires_at?: number;
  duration_seconds?: number;
  resume_position_seconds?: number;
  subtitles?: StreamTrack[];
  audio_tracks?: StreamTrack[];
}

export const getMovieById = async (id: string): Promise<MovieDetail | null> => {
  const res = await api.get<MovieResponse>(`/api/v1/movies/${id}`);
  if (!res.data?.success) return null;
  return res.data.data;
};

export const getMovieStream = async (movieId: string): Promise<MovieStreamPayload | null> => {
  const res = await api.get<MovieStreamPayload>(`/api/v1/streaming/movie/${movieId}`);
  if (!res.data?.stream_url) return null;
  return res.data;
};

export const updateMovieStreamProgress = async (
  movieId: string,
  positionSeconds: number,
): Promise<boolean> => {
  try {
    const res = await api.post(`/api/v1/streaming/movie/${movieId}/progress`, undefined, {
      params: { position_seconds: Math.max(0, Math.floor(positionSeconds)) },
    });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
};
