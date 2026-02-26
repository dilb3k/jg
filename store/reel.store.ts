import {
  getByMovie,
  getReelDetail,
  getReelFeed,
  getReelStreamingUrl,
  getTrendingReels,
  likeReel,
  unlikeReel,
} from "@/services/reel.service";
import { Reel } from "@/shared/types/reel";
import { create } from "zustand";

interface ReelState {
  reels: Reel[];
  currentIndex: number;
  loading: boolean;
  hasMore: boolean;
  page: number;
  isTrending: boolean;
  likePending: Record<string, boolean>;
  streamUrlMap: Record<string, string>;

  fetchInitial: () => Promise<void>;
  fetchMore: () => Promise<void>;
  fetchByMovie: (movieId: string) => Promise<void>;
  setCurrentIndex: (index: number) => void;
  toggleLike: (reelId: string) => Promise<void>;
  fetchStreamUrl: (reelId: string) => Promise<string | null>;
}

const mergeUniqueReels = (current: Reel[], incoming: Reel[]) => {
  if (incoming.length === 0) return current;

  const seen = new Set(current.map((item) => item.id));
  const uniqueIncoming = incoming.filter((item) => !seen.has(item.id));

  return uniqueIncoming.length > 0 ? [...current, ...uniqueIncoming] : current;
};

export const useReelStore = create<ReelState>((set, get) => ({
  reels: [],
  currentIndex: 0,
  loading: true,
  hasMore: true,
  page: 1,
  isTrending: false,
  likePending: {},
  streamUrlMap: {},

  async fetchInitial() {
    set({ loading: true });

    try {
      const [trending, feed] = await Promise.all([getTrendingReels(), getReelFeed(1)]);

      if (feed.length === 0 && trending.length > 0) {
        set({
          reels: trending,
          currentIndex: 0,
          isTrending: true,
          hasMore: false,
          loading: false,
        });
        return;
      }

      const initial = mergeUniqueReels(feed, trending);
      set({
        reels: initial,
        currentIndex: 0,
        page: 2,
        hasMore: feed.length === 15,
        isTrending: false,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  async fetchMore() {
    const { loading, hasMore, isTrending, page } = get();
    if (loading || !hasMore || isTrending) return;

    set({ loading: true });
    try {
      const data = await getReelFeed(page);
      set((state) => ({
        reels: mergeUniqueReels(state.reels, data),
        page: page + 1,
        hasMore: data.length === 15,
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  async fetchByMovie(movieId: string) {
    const { loading, hasMore, isTrending, page } = get();
    if (loading || !hasMore || isTrending) return;

    set({ loading: true });
    try {
      const data = await getByMovie(page, 10, movieId);
      set((state) => ({
        reels: mergeUniqueReels(state.reels, data),
        page: page + 1,
        hasMore: data.length === 10,
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  setCurrentIndex: (index) => set({ currentIndex: index }),

  async toggleLike(reelId: string) {
    if (get().likePending[reelId]) return;

    const reel = get().reels.find((r) => r.id === reelId);
    if (!reel) return;

    const willBeLiked = !reel.is_liked;

    // Optimistic update: mark pending and update UI in a single set call
    set((state) => ({
      likePending: { ...state.likePending, [reelId]: true },
      reels: state.reels.map((r) =>
        r.id === reelId
          ? {
              ...r,
              is_liked: willBeLiked,
              likes_count: Math.max(0, r.likes_count + (willBeLiked ? 1 : -1)),
            }
          : r,
      ),
    }));

    const success = willBeLiked
      ? await likeReel(reelId)
      : await unlikeReel(reelId);

    if (!success) {
      // Roll back optimistic update
      set((state) => ({
        reels: state.reels.map((r) =>
          r.id === reelId
            ? {
                ...r,
                is_liked: !willBeLiked,
                likes_count: Math.max(0, r.likes_count + (willBeLiked ? -1 : 1)),
              }
            : r,
        ),
      }));
    }

    const fresh = await getReelDetail(reelId);
    if (fresh) {
      set((state) => ({
        reels: state.reels.map((r) => (r.id === reelId ? { ...r, ...fresh } : r)),
      }));
    }

    set((state) => ({
      likePending: { ...state.likePending, [reelId]: false },
    }));
  },

  async fetchStreamUrl(reelId: string) {
    const existing = get().streamUrlMap[reelId];
    if (existing) return existing;

    const url = await getReelStreamingUrl(reelId);
    if (url) {
      set((state) => ({
        streamUrlMap: { ...state.streamUrlMap, [reelId]: url },
      }));
      return url;
    }
    return null;
  },
}));
