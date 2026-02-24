import { publicApi } from "@/services/api";
import {
  TvCategory,
  TvChannel,
  TvChannelDetail,
  TvChannelsPage,
  TvProgram,
} from "@/shared/types/tv";
import { AppLanguage } from "@/store/settings.store";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface TvChannelsApiPayload {
  items?: TvChannel[];
  total?: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
}

interface TvChannelsParams {
  language: AppLanguage;
  page?: number;
  perPage?: number;
  categoryId?: string;
  status?: string;
  search?: string;
}

const DEFAULT_CHANNELS_PAGE: TvChannelsPage = {
  items: [],
  total: 0,
  page: 1,
  per_page: 20,
  total_pages: 1,
};

export const getTvCategories = async (language: AppLanguage): Promise<TvCategory[]> => {
  const res = await publicApi.get<ApiResponse<TvCategory[]>>("/api/v1/tv/categories", {
    headers: { "Accept-Language": language },
  });

  if (!res.data?.success || !Array.isArray(res.data.data)) return [];
  return res.data.data;
};

export const getTvChannels = async (params: TvChannelsParams): Promise<TvChannelsPage> => {
  const res = await publicApi.get<ApiResponse<TvChannelsApiPayload>>("/api/v1/tv/channels", {
    params: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      ...(params.categoryId ? { category_id: params.categoryId } : null),
      ...(params.status ? { status: params.status } : null),
      ...(params.search?.trim() ? { search: params.search.trim() } : null),
    },
    headers: { "Accept-Language": params.language },
  });

  if (!res.data?.success || !res.data.data) return DEFAULT_CHANNELS_PAGE;

  const payload = res.data.data;
  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    total: typeof payload.total === "number" ? payload.total : 0,
    page: typeof payload.page === "number" ? payload.page : 1,
    per_page: typeof payload.per_page === "number" ? payload.per_page : 20,
    total_pages: typeof payload.total_pages === "number" ? payload.total_pages : 1,
  };
};

export const getTvChannelDetail = async (
  channelId: string,
  language: AppLanguage,
): Promise<TvChannelDetail | null> => {
  const res = await publicApi.get<ApiResponse<TvChannelDetail>>(`/api/v1/tv/channels/${channelId}`, {
    headers: { "Accept-Language": language },
  });

  if (!res.data?.success || !res.data.data) return null;
  return res.data.data;
};

export const getTvChannelEpg = async (params: {
  channelId: string;
  startDate: string;
  endDate: string;
  language: AppLanguage;
}): Promise<TvProgram[]> => {
  const res = await publicApi.get<ApiResponse<TvProgram[]>>(
    `/api/v1/tv/channels/${params.channelId}/epg`,
    {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
      },
      headers: { "Accept-Language": params.language },
    },
  );

  if (!res.data?.success || !Array.isArray(res.data.data)) return [];

  return [...res.data.data].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
};

export const getTvCurrentProgram = async (
  channelId: string,
  language: AppLanguage,
): Promise<TvProgram | null> => {
  const res = await publicApi.get<ApiResponse<TvProgram>>(
    `/api/v1/tv/channels/${channelId}/epg/current`,
    {
      headers: { "Accept-Language": language },
    },
  );

  if (!res.data?.success || !res.data.data) return null;
  return res.data.data;
};

export const getTvUpcomingPrograms = async (
  channelId: string,
  language: AppLanguage,
  limit = 10,
): Promise<TvProgram[]> => {
  const res = await publicApi.get<ApiResponse<TvProgram[]>>(
    `/api/v1/tv/channels/${channelId}/epg/upcoming`,
    {
      params: { limit },
      headers: { "Accept-Language": language },
    },
  );

  if (!res.data?.success || !Array.isArray(res.data.data)) return [];

  return [...res.data.data].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
};
