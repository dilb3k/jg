import {
  FavoriteMovie,
  addFavoriteMovie,
  checkFavoriteMovie,
  listFavoriteMovies,
  removeFavoriteMovie,
} from "@/services/favorites.service";
import { create } from "zustand";

interface FavoritesState {
  items: FavoriteMovie[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  page: number;
  favoriteMap: Record<string, boolean>;
  fetchInitial: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchMore: () => Promise<void>;
  checkFavorite: (movieId: string) => Promise<boolean>;
  toggleFavorite: (movieId: string) => Promise<boolean | null>;
}

const PAGE_SIZE = 20;

const mergeUniqueByMovie = (current: FavoriteMovie[], next: FavoriteMovie[]) => {
  const map = new Map<string, FavoriteMovie>();
  current.forEach((item) => map.set(item.movie.id, item));
  next.forEach((item) => map.set(item.movie.id, item));
  return Array.from(map.values());
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  items: [],
  loading: false,
  refreshing: false,
  loadingMore: false,
  hasNext: true,
  page: 1,
  favoriteMap: {},

  fetchInitial: async () => {
    set({ loading: true });
    try {
      const result = await listFavoriteMovies(1, PAGE_SIZE);
      const favoriteMap = result.items.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.movie.id] = true;
        acc[item.movie_id] = true;
        return acc;
      }, {});

      set({
        items: result.items,
        hasNext: result.has_next,
        page: result.page,
        loading: false,
        favoriteMap: { ...get().favoriteMap, ...favoriteMap },
      });
    } catch {
      set({ loading: false });
    }
  },

  refresh: async () => {
    set({ refreshing: true });
    try {
      const result = await listFavoriteMovies(1, PAGE_SIZE);
      const favoriteMap = result.items.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.movie.id] = true;
        acc[item.movie_id] = true;
        return acc;
      }, {});

      set({
        items: result.items,
        hasNext: result.has_next,
        page: result.page,
        refreshing: false,
        favoriteMap: { ...get().favoriteMap, ...favoriteMap },
      });
    } catch {
      set({ refreshing: false });
    }
  },

  fetchMore: async () => {
    const { loadingMore, hasNext, page } = get();
    if (loadingMore || !hasNext) return;

    set({ loadingMore: true });
    try {
      const nextPage = page + 1;
      const result = await listFavoriteMovies(nextPage, PAGE_SIZE);
      set((state) => ({
        items: mergeUniqueByMovie(state.items, result.items),
        hasNext: result.has_next,
        page: result.page,
        loadingMore: false,
      }));
    } catch {
      set({ loadingMore: false });
    }
  },

  checkFavorite: async (movieId: string) => {
    const cached = get().favoriteMap[movieId];
    if (typeof cached === "boolean") return cached;

    try {
      const isFavorite = await checkFavoriteMovie(movieId);
      set((state) => ({
        favoriteMap: { ...state.favoriteMap, [movieId]: isFavorite },
      }));
      return isFavorite;
    } catch {
      return false;
    }
  },

  toggleFavorite: async (movieId: string) => {
    const currentlyFavorite = await get().checkFavorite(movieId);

    try {
      if (currentlyFavorite) {
        const removed = await removeFavoriteMovie(movieId);
        if (!removed) return null;

        set((state) => ({
          favoriteMap: { ...state.favoriteMap, [movieId]: false },
          items: state.items.filter(
            (item) => item.movie_id !== movieId && item.movie.id !== movieId,
          ),
        }));
        return false;
      }

      const added = await addFavoriteMovie(movieId);
      set((state) => ({
        favoriteMap: { ...state.favoriteMap, [movieId]: true },
        items: added ? mergeUniqueByMovie([added], state.items) : state.items,
      }));
      return true;
    } catch {
      return null;
    }
  },
}));
