export interface TvCategory {
  id: string;
  name: string;
  slug: string;
}

export interface TvChannel {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  category_id: string;
  order_number: number;
  status: string;
}

export interface TvProgram {
  id: string;
  channel_id: string;
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at: string;
}

export interface TvChannelDetail extends TvChannel {
  flussonic_stream_name?: string;
  category?: TvCategory;
  current_program?: TvProgram | null;
}

export interface TvChannelsPage {
  items: TvChannel[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
