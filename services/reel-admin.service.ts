import { api } from "@/services/api";
import { Reel } from "@/shared/types/reel";

export type ReelStatus = "draft" | "available" | "unavailable";

export interface CreateReelPayload {
  title_uz?: string;
  title_ru?: string;
  title_en?: string;
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
  poster_url?: string;
  duration_seconds?: number;
  status?: ReelStatus;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string | null;
  data: T;
}

interface AdminListPayload {
  items: Reel[];
  page: number;
  per_page: number;
  total: number;
}

export const adminCreateReel = async (payload: CreateReelPayload): Promise<Reel | null> => {
  const res = await api.post<ApiEnvelope<Reel>>("/api/v1/admin/reels", payload);
  if (!res.data?.success) return null;
  return res.data.data;
};

export const adminUpdateReel = async (
  reelId: string,
  payload: Partial<CreateReelPayload>,
): Promise<Reel | null> => {
  const res = await api.put<ApiEnvelope<Reel>>(`/api/v1/admin/reels/${reelId}`, payload);
  if (!res.data?.success) return null;
  return res.data.data;
};

export const adminPublishReel = async (reelId: string): Promise<Reel | null> =>
  adminUpdateReel(reelId, { status: "available" });

export const adminListReels = async (
  page = 1,
  perPage = 20,
  status?: ReelStatus,
): Promise<AdminListPayload> => {
  const res = await api.get<ApiEnvelope<AdminListPayload>>("/api/v1/admin/reels", {
    params: { page, per_page: perPage, status },
  });

  if (!res.data?.success) {
    return { items: [], page, per_page: perPage, total: 0 };
  }

  return res.data.data;
};

export const adminGetReel = async (reelId: string): Promise<Reel | null> => {
  const res = await api.get<ApiEnvelope<Reel>>(`/api/v1/admin/reels/${reelId}`);
  if (!res.data?.success) return null;
  return res.data.data;
};

export const adminDeleteReel = async (reelId: string): Promise<boolean> => {
  const res = await api.delete(`/api/v1/admin/reels/${reelId}`);
  return res.status >= 200 && res.status < 300;
};

export const adminUploadReelVideo = async (
  reelId: string,
  file: { uri: string; name: string; type?: string },
): Promise<boolean> => {
  const formData = new FormData();
  formData.append("video_file", {
    uri: file.uri,
    name: file.name,
    type: file.type ?? "video/mp4",
  } as unknown as Blob);

  const res = await api.post(`/api/v1/admin/content/reels/${reelId}/upload-video`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.status >= 200 && res.status < 300;
};

export const adminDeleteReelVideo = async (reelId: string): Promise<boolean> => {
  const res = await api.delete(`/api/v1/admin/content/reels/${reelId}/video`);
  return res.status >= 200 && res.status < 300;
};

export const adminLinkReelMovie = async (reelId: string, movieId: string): Promise<boolean> => {
  const res = await api.post(`/api/v1/admin/reels/${reelId}/link-movie`, { movie_id: movieId });
  return res.status >= 200 && res.status < 300;
};

export const adminUnlinkReelMovie = async (
  reelId: string,
  movieId: string,
): Promise<boolean> => {
  const res = await api.delete(`/api/v1/admin/reels/${reelId}/unlink-movie/${movieId}`);
  return res.status >= 200 && res.status < 300;
};

export const adminLinkReelEpisode = async (
  reelId: string,
  episodeId: string,
): Promise<boolean> => {
  const res = await api.post(`/api/v1/admin/reels/${reelId}/link-episode`, {
    episode_id: episodeId,
  });
  return res.status >= 200 && res.status < 300;
};

export const adminUnlinkReelEpisode = async (
  reelId: string,
  episodeId: string,
): Promise<boolean> => {
  const res = await api.delete(`/api/v1/admin/reels/${reelId}/unlink-episode/${episodeId}`);
  return res.status >= 200 && res.status < 300;
};
