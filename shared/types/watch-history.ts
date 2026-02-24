export interface WatchHistoryItem {
  type: 'movie' | 'episode'
  id: string
  content_id: string
  title_uz?: string
  title_ru?: string
  title_en?: string
  series_title_uz?: string
  series_title_ru?: string
  series_title_en?: string
  season_number?: number | null
  episode_number?: number | null
  poster_url: string
  imdb_rating?: string
  last_position_seconds: number
  total_duration_seconds: number
  progress_percent: number
}
