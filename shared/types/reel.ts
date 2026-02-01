export interface Reel {
  id: string;
  title_uz?: string;
  title_ru?: string;
  title_en?: string;
  poster_url: string;
  flussonic_vod_path?: string;
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
}
