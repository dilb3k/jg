import { create } from "zustand";
import { Reel } from "@/shared/types/reel";
import {
  getReelFeed,
  getTrendingReels,
  likeReel,
  unlikeReel,
} from "@/services/reel.service";

type ReelState = {
  reels: Reel[];
  currentIndex: number;
  loading: boolean;
  hasMore: boolean;
  page: number;
  isTrending: boolean;

  fetchInitial: () => Promise<void>;
  fetchMore: () => Promise<void>;
  setCurrentIndex: (index: number) => void;
  toggleLike: (reelId: string) => Promise<void>;
};

export const useReelStore = create<ReelState>((set, get) => ({
  reels: [],
  currentIndex: 0,
  loading: false,
  hasMore: true,
  page: 1,
  isTrending: false,

  fetchInitial: async () => {
    set({ loading: true });

    const trending = await getTrendingReels();
    if (trending.length) {
      set({
        reels: trending,
        isTrending: true,
        hasMore: false,
        loading: false,
      });
      return;
    }

    const feed = await getReelFeed(1);
    set({
      reels: feed,
      page: 2,
      hasMore: feed.length === 15,
      loading: false,
    });
  },

  fetchMore: async () => {
    const { loading, hasMore, isTrending, page } = get();
    if (loading || !hasMore || isTrending) return;

    set({ loading: true });
    const data = await getReelFeed(page);

    set((state) => ({
      reels: [...state.reels, ...data],
      page: page + 1,
      hasMore: data.length === 15,
      loading: false,
    }));
  },

  setCurrentIndex: (index) => set({ currentIndex: index }),

  toggleLike: async (reelId) => {
    const reel = get().reels.find((r) => r.id === reelId);
    if (!reel) return;

    const nextLike = !reel.is_liked;

    set((state) => ({
      reels: state.reels.map((r) =>
        r.id === reelId
          ? {
              ...r,
              is_liked: nextLike,
              likes_count: r.likes_count + (nextLike ? 1 : -1),
            }
          : r,
      ),
    }));

    const ok = nextLike ? await likeReel(reelId) : await unlikeReel(reelId);
    if (ok) return;

    set((state) => ({
      reels: state.reels.map((r) =>
        r.id === reelId
          ? {
              ...r,
              is_liked: !nextLike,
              likes_count: r.likes_count + (nextLike ? -1 : 1),
            }
          : r,
      ),
    }));
  },
}));
