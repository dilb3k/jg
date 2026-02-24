export type SearchItemType = "movie" | "series";

export interface SearchGenre {
  id: string;
  name: string;
  slug?: string;
}

export interface SearchCountry {
  id: string;
  name: string;
  code?: string;
}

export interface SearchItem {
  id: string;
  type: SearchItemType;
  title_uz?: string;
  title_ru?: string;
  title_en?: string;
  imdb_rating?: number;
  poster_url: string;
  year?: number | null;
  views_count?: number;
  genres: SearchGenre[];
}

export interface SearchPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export type SearchContentFilter = "all" | SearchItemType;
export type SearchQuality = "hd" | "full_hd" | "2k" | "4k";
export type SearchSortBy = "rating" | "popularity" | "date";

export interface SearchFilters {
  type: SearchContentFilter;
  genreIds: string[];
  countryIds: string[];
  hasSubtitle: boolean;
  quality?: SearchQuality;
  ratingFrom?: number;
  ratingTo?: number;
  yearFrom?: number;
  yearTo?: number;
  sortBy?: SearchSortBy;
}
