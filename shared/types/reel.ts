export interface Reel {
  id: string;
  title_uz?: string;
  title_ru?: string;
  title_en?: string;
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
  status?: "draft" | "available" | "unavailable";
  poster_url: string;
  flussonic_vod_path?: string;
  video_url?: string;
  stream_url?: string;
  m3u8_url?: string;
  video_path?: string;
  duration_seconds: number;
  views_count: number;
  likes_count: number;
  is_liked?: boolean;
  linked_movies?: Array<{
    id: string;
    title_uz?: string;
    title_ru?: string;
    title_en?: string;
    poster_url: string;
  }>;
  linked_episodes?: Array<{
    id: string;
    title_uz?: string;
    title_ru?: string;
    title_en?: string;
  }>;
}
