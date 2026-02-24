import { api, publicApi } from "./api";
import { Reel } from "@/shared/types/reel";
import { isAxiosError } from "axios";

interface PaginatedReelsResponse {
  success: boolean;
  data: {
    items?: ReelApiItem[];
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

interface TrendingReelsResponse {
  success: boolean;
  data: ReelApiItem[];
}

interface ReelDetailResponse {
  success: boolean;
  data: ReelApiItem;
}

interface ReelStreamingResponse {
  reel_id: string;
  stream_url: string;
  expires_at?: number;
  duration_seconds?: number;
}

type ReelApiItem = Partial<Reel> & {
  id?: string;
  poster_url?: string;
  status?: "draft" | "available" | "unavailable";
};

const normalizeReel = (item: ReelApiItem): Reel | null => {
  if (!item.id) return null;

  const poster =
    item.poster_url ??
    item.linked_movies?.[0]?.poster_url;

  if (!poster) return null;

  return {
    id: item.id,
    title_uz: item.title_uz,
    title_ru: item.title_ru,
    title_en: item.title_en,
    description_uz: item.description_uz,
    description_ru: item.description_ru,
    description_en: item.description_en,
    status: item.status,
    poster_url: poster,
    flussonic_vod_path: item.flussonic_vod_path,
    video_url: item.video_url,
    stream_url: item.stream_url,
    m3u8_url: item.m3u8_url,
    video_path: item.video_path,
    duration_seconds: Number(item.duration_seconds ?? 0),
    views_count: Number(item.views_count ?? 0),
    likes_count: Number(item.likes_count ?? 0),
    is_liked: Boolean(item.is_liked),
    linked_movies: Array.isArray(item.linked_movies) ? item.linked_movies : [],
    linked_episodes: Array.isArray(item.linked_episodes) ? item.linked_episodes : [],
  };
};

const normalizeReels = (payload: unknown): Reel[] => {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => normalizeReel(item as ReelApiItem))
    .filter((item): item is Reel => item !== null)
    .filter((item) => !item.status || item.status === "available");
};

export const getReelFeed = async (page = 1, per_page = 15): Promise<Reel[]> => {
  try {
    const res = await api.get<PaginatedReelsResponse | { success: boolean; data: ReelApiItem[] }>(
      "/api/v1/reels",
      {
      params: { page, per_page },
      },
    );

    if (!res.data?.success) return [];
    const data = Array.isArray((res.data as { data: unknown }).data)
      ? (res.data as { data: ReelApiItem[] }).data
      : (res.data as PaginatedReelsResponse).data?.items;

    return normalizeReels(data);
  } catch (e) {
    if (__DEV__) console.error("getReelFeed error:", e);
    return [];
  }
};

export const getByMovie = async (
  page = 1,
  per_page = 10,
  movie_id?: string,
): Promise<Reel[]> => {
  if (!movie_id) return [];

  try {
    const res = await api.get<PaginatedReelsResponse | { success: boolean; data: ReelApiItem[] }>(
      `/api/v1/reels/by-movie/${movie_id}`,
      {
        params: { page, per_page },
      },
    );
    if (!res.data?.success) return [];
    const data = Array.isArray((res.data as { data: unknown }).data)
      ? (res.data as { data: ReelApiItem[] }).data
      : (res.data as PaginatedReelsResponse).data?.items;
    return normalizeReels(data);
  } catch (e) {
    if (__DEV__) console.error("getByMovie error:", e);
    return [];
  }
};

export const getTrendingReels = async (limit = 10): Promise<Reel[]> => {
  try {
    const res = await api.get<TrendingReelsResponse>("/api/v1/reels/trending", {
      params: { limit },
    });
    return res.data.success ? normalizeReels(res.data.data) : [];
  } catch (e) {
    if (__DEV__) console.error("getTrendingReels error:", e);
    return [];
  }
};

export const getReelDetail = async (reelId: string): Promise<Reel | null> => {
  try {
    const res = await api.get<ReelDetailResponse>(`/api/v1/reels/${reelId}`);
    if (!res.data?.success) return null;
    return normalizeReel(res.data.data);
  } catch (e) {
    if (__DEV__) console.error("getReelDetail error:", e);
    return null;
  }
};

export const getReelStreamingUrl = async (reelId: string): Promise<string | null> => {
  try {
    const res = await api.get<ReelStreamingResponse>(`/api/v1/streaming/reel/${reelId}`);
    return res.data?.stream_url ?? null;
  } catch {
    // fallback for guests/public mode
    try {
      const res = await publicApi.get<ReelStreamingResponse>(`/api/v1/streaming/reel/${reelId}`);
      return res.data?.stream_url ?? null;
    } catch (e) {
      if (__DEV__) console.error("getReelStreamingUrl error:", e);
      return null;
    }
  }
};

export const likeReel = async (reelId: string): Promise<boolean> => {
  try {
    const res = await api.post(`/api/v1/reels/${reelId}/like`);
    return res.status >= 200 && res.status < 300;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 400) {
      // Backend may return 400 "Already liked".
      return true;
    }
    if (__DEV__) console.error("likeReel error:", e);
    return false;
  }
};

export const unlikeReel = async (reelId: string): Promise<boolean> => {
  try {
    const res = await api.delete(`/api/v1/reels/${reelId}/like`);
    return res.status >= 200 && res.status < 300;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 400) {
      // Backend may return 400 "not liked/already unliked".
      return true;
    }
    if (__DEV__) console.error("unlikeReel error:", e);
    return false;
  }
};
