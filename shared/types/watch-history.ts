export interface WatchHistoryItem {
  type: 'movie' | 'episode'
  id: string
  content_id: string
  title_uz?: string
  title_ru?: string
  title_en?: string
  poster_url: string
  last_position_seconds: number
  total_duration_seconds: number
  progress_percent: number
}
