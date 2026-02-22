import { api, publicApi } from "./api";
import { Reel } from "@/shared/types/reel";

interface PaginatedReelsResponse {
  success: boolean;
  data: {
    items: Reel[];
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

interface TrendingReelsResponse {
  success: boolean;
  data: Reel[];
}

export const getReelFeed = async (page = 1, per_page = 15): Promise<Reel[]> => {
  try {
    const res = await publicApi.get<PaginatedReelsResponse>("/api/v1/reels", {
      params: { page, per_page },
    });
    return res.data.success ? res.data.data.items : [];
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
    const res = await publicApi.get<PaginatedReelsResponse>(
      "/api/v1/reels/by-movie",
      {
        params: { page, per_page, movie_id },
      },
    );
    return res.data.success ? res.data.data.items : [];
  } catch (e) {
    if (__DEV__) console.error("getByMovie error:", e);
    return [];
  }
};

export const getTrendingReels = async (limit = 10): Promise<Reel[]> => {
  try {
    const res = await publicApi.get<TrendingReelsResponse>("/api/v1/reels/trending", {
      params: { limit },
    });
    return res.data.success ? res.data.data : [];
  } catch (e) {
    if (__DEV__) console.error("getTrendingReels error:", e);
    return [];
  }
};

export const likeReel = async (reelId: string): Promise<boolean> => {
  try {
    const res = await api.post(`/api/v1/reels/${reelId}/like`);
    return !!res.data?.success;
  } catch (e) {
    if (__DEV__) console.error("likeReel error:", e);
    return false;
  }
};

export const unlikeReel = async (reelId: string): Promise<boolean> => {
  try {
    const res = await api.delete(`/api/v1/reels/${reelId}/like`);
    return !!res.data?.success;
  } catch (e) {
    if (__DEV__) console.error("unlikeReel error:", e);
    return false;
  }
};
