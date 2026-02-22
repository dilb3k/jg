import {
  getByMovie,
  getReelFeed,
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

  

  fetchInitial: () => Promise<void>;
  fetchMore: () => Promise<void>;
  fetchByMovie: (movieId: string) => Promise<void>;
  setCurrentIndex: (index: number) => void;
  toggleLike: (reelId: string) => Promise<void>;
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

  async fetchInitial() {
    set({ loading: true });

    const trending = await getTrendingReels();
    if (trending.length > 0) {
      set({
        reels: trending,
        currentIndex: 0,
        isTrending: true,
        hasMore: false,
        loading: false,
      });
      return;
    }

    const feed = await getReelFeed(1);
    set({
      reels: feed,
      currentIndex: 0,
      page: 2,
      hasMore: feed.length === 15,
      isTrending: false,
      loading: false,
    });
  },

  async fetchMore() {
    const { loading, hasMore, isTrending, page } = get();
    if (loading || !hasMore || isTrending) return;

    set({ loading: true });
    const data = await getReelFeed(page);

    set((state) => ({
      reels: mergeUniqueReels(state.reels, data),
      page: page + 1,
      hasMore: data.length === 15,
      loading: false,
    }));
  },

  async fetchByMovie(movieId: string) {
    const { loading, hasMore, isTrending, page } = get();
    if (loading || !hasMore || isTrending) return;

    set({ loading: true });
    const data = await getByMovie(page, 10, movieId);

    set((state) => ({
      reels: mergeUniqueReels(state.reels, data),
      page: page + 1,
      hasMore: data.length === 10,
      loading: false,
    }));
  },

  setCurrentIndex: (index) => set({ currentIndex: index }),

  async toggleLike(reelId: string) {
    const reel = get().reels.find((r) => r.id === reelId);
    if (!reel) return;

    const willBeLiked = !reel.is_liked;

    set((state) => ({
      reels: state.reels.map((r) =>
        r.id === reelId
          ? {
              ...r,
              is_liked: willBeLiked,
              likes_count: r.likes_count + (willBeLiked ? 1 : -1),
            }
          : r,
      ),
    }));

    const success = willBeLiked
      ? await likeReel(reelId)
      : await unlikeReel(reelId);

    if (!success) {
      set((state) => ({
        reels: state.reels.map((r) =>
          r.id === reelId
            ? {
                ...r,
                is_liked: !willBeLiked,
                likes_count: r.likes_count + (willBeLiked ? -1 : 1),
              }
            : r,
        ),
      }));
    }
  },
}));
