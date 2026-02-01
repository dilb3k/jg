import { Reel } from "@/shared/types/reel";
import { api } from "./api";

type ReelsResponse = {
  success: boolean;
  data: {
    items: Reel[];
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

type TrendingResponse = {
  success: boolean;
  data: Reel[];
};

export const getReelFeed = (page = 1, per_page = 15) =>
  api
    .get<ReelsResponse>("/api/v1/reels", { params: { page, per_page } })
    .then((res) => (res.data.success ? res.data.data.items : []))
    .catch(() => []);

export const getTrendingReels = (limit = 12) =>
  api
    .get<TrendingResponse>("/api/v1/reels/trending", { params: { limit } })
    .then((res) => (res.data.success ? res.data.data : []))
    .catch(() => []);

export const likeReel = (reelId: string) =>
  api
    .post(`/api/v1/reels/${reelId}/like`)
    .then((res) => !!res.data?.success)
    .catch(() => false);

export const unlikeReel = (reelId: string) =>
  api
    .delete(`/api/v1/reels/${reelId}/like`)
    .then((res) => !!res.data?.success)
    .catch(() => false);
