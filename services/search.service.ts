import { publicApi } from "@/services/api";
import {
  SearchCountry,
  SearchFilters,
  SearchGenre,
  SearchItem,
  SearchPagination,
} from "@/shared/types/search";
import { AppLanguage } from "@/store/settings.store";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface SearchApiResponse {
  success: boolean;
  data: Array<{
    id: string;
    type: "movie" | "series";
    title_uz?: string;
    title_ru?: string;
    title_en?: string;
    imdb_rating?: number | string | null;
    poster_url?: string;
    year?: number | null;
    views_count?: number;
    genres?: Array<{ id: string; name: string; slug?: string }>;
  }>;
  pagination?: SearchPagination;
}

interface SearchRequestParams {
  q?: string;
  page?: number;
  perPage?: number;
  filters?: SearchFilters;
  language: AppLanguage;
}

interface SearchResult {
  items: SearchItem[];
  pagination: SearchPagination;
}

const DEFAULT_PAGINATION: SearchPagination = {
  page: 1,
  per_page: 20,
  total: 0,
  total_pages: 1,
};

const normalizeSearchItem = (item: SearchApiResponse["data"][number]): SearchItem | null => {
  if (!item?.id || !item.poster_url) return null;

  const ratingRaw = item.imdb_rating;
  const rating =
    typeof ratingRaw === "number"
      ? ratingRaw
      : typeof ratingRaw === "string" && ratingRaw.trim().length > 0
        ? Number(ratingRaw)
        : undefined;

  return {
    id: item.id,
    type: item.type,
    title_uz: item.title_uz,
    title_ru: item.title_ru,
    title_en: item.title_en,
    imdb_rating: Number.isFinite(rating) ? rating : undefined,
    poster_url: item.poster_url,
    year: item.year,
    views_count: item.views_count,
    genres: Array.isArray(item.genres) ? item.genres : [],
  };
};

const buildSearchParams = (params: SearchRequestParams) => {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };

  const q = params.q?.trim();
  if (q) query.q = q;

  const filters = params.filters;
  if (!filters) return query;

  if (filters.type !== "all") query.type = filters.type;
  if (filters.genreIds.length > 0) query.genres = filters.genreIds.join(",");
  if (filters.countryIds.length > 0) query.countries = filters.countryIds.join(",");
  if (filters.hasSubtitle) query.has_subtitle = true;
  if (filters.quality) query.quality = filters.quality;

  if (typeof filters.ratingFrom === "number") query.rating_from = filters.ratingFrom;
  if (typeof filters.ratingTo === "number") query.rating_to = filters.ratingTo;
  if (typeof filters.yearFrom === "number") query.year_from = filters.yearFrom;
  if (typeof filters.yearTo === "number") query.year_to = filters.yearTo;
  if (filters.sortBy) query.sort_by = filters.sortBy;

  return query;
};

export const searchContent = async (params: SearchRequestParams): Promise<SearchResult> => {
  const res = await publicApi.get<SearchApiResponse>("/api/v1/common/search", {
    params: buildSearchParams(params),
    headers: {
      "Accept-Language": params.language,
    },
  });

  if (!res.data?.success) {
    return {
      items: [],
      pagination: DEFAULT_PAGINATION,
    };
  }

  const items = Array.isArray(res.data.data)
    ? res.data.data
        .map(normalizeSearchItem)
        .filter((item): item is SearchItem => item !== null)
    : [];

  return {
    items,
    pagination: res.data.pagination ?? { ...DEFAULT_PAGINATION, total: items.length },
  };
};

export const getCountries = async (
  language: AppLanguage,
  search?: string,
): Promise<SearchCountry[]> => {
  const res = await publicApi.get<ApiResponse<SearchCountry[]>>("/api/v1/common/country", {
    params: search?.trim() ? { search: search.trim() } : undefined,
    headers: {
      "Accept-Language": language,
    },
  });

  if (!res.data?.success || !Array.isArray(res.data.data)) return [];
  return res.data.data;
};

export const getSearchGenres = async (
  language: AppLanguage,
  search?: string,
): Promise<SearchGenre[]> => {
  const res = await publicApi.get<ApiResponse<SearchGenre[]>>("/api/v1/common/genres", {
    params: search?.trim() ? { search: search.trim() } : undefined,
    headers: {
      "Accept-Language": language,
    },
  });

  if (!res.data?.success || !Array.isArray(res.data.data)) return [];
  return res.data.data;
};
