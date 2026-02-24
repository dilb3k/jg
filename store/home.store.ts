import {
  Carousel,
  getCarousels,
  getContinueWatching,
  getGenres,
  getMoviesByGenre,
} from "@/services/home.service";
import { Movie } from "@/shared/types/movie";
import { WatchHistoryItem } from "@/shared/types/watch-history";
import { create } from "zustand";

export interface Category {
  id: string;
  title: string;
  movies: Movie[];
}

interface HomeState {
  carousels: Carousel[];
  categories: Category[];
  watchHistory: WatchHistoryItem[];
  loading: boolean;
  error: boolean;
  fetchHomeData: () => Promise<void>;
  fetchCategoryMovies: (genreId: string) => Promise<Movie[]>;
}

export const useHomeStore = create<HomeState>((set) => ({
  carousels: [],
  categories: [],
  watchHistory: [],
  loading: true,
  error: false,

  fetchHomeData: async () => {
    try {
      set({ loading: true, error: false });

      const [carousels, genres, watchHistory] = await Promise.allSettled([
        getCarousels(),
        getGenres(),
        getContinueWatching(),
      ]);

      const resolvedCarousels = carousels.status === "fulfilled" ? carousels.value : [];
      const resolvedHistory = watchHistory.status === "fulfilled" ? watchHistory.value : [];

      let resolvedCategories: Category[] = [];
      if (genres.status === "fulfilled") {
        const prioritizedGenres = genres.value.slice(0, 8);
        resolvedCategories = await Promise.all(
          prioritizedGenres.map(async (genre) => {
            try {
              const movies = await getMoviesByGenre(genre.id, 1, 12);
              return {
                id: genre.id,
                title: genre.name,
                movies,
              };
            } catch {
              return {
                id: genre.id,
                title: genre.name,
                movies: [],
              };
            }
          }),
        );
      }

      const hasAnyMainData = resolvedCarousels.length > 0 || resolvedCategories.length > 0;

      set({
        carousels: resolvedCarousels,
        watchHistory: resolvedHistory,
        categories: resolvedCategories,
        error: !hasAnyMainData,
        loading: false,
      });
    } catch {
      set({ loading: false, error: true });
    }
  },

  fetchCategoryMovies: async (genreId) => {
    try {
      return await getMoviesByGenre(genreId);
    } catch {
      return [];
    }
  },
}));
