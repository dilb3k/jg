import {
  Carousel,
  getCarousels,
  getContinueWatching,
  getGenres,
  getLatestMovies,
  getMoviesByGenre,
  getPopularMovies,
} from "@/services/home.service";
import { Movie } from "@/shared/types/movie";
import { WatchHistoryItem } from "@/shared/types/watch-history";
import { create } from "zustand";

export interface Category {
  id: string;
  title: string;
  movies: Movie[];
}

export interface HomeSection {
  id: string;
  title: string;
  movies: Movie[];
  source: "genre" | "popular" | "latest";
}

interface HomeState {
  carousels: Carousel[];
  categories: Category[];
  homeSections: HomeSection[];
  watchHistory: WatchHistoryItem[];
  loading: boolean;
  error: boolean;
  fetchHomeData: () => Promise<void>;
  fetchCategoryMovies: (genreId: string) => Promise<Movie[]>;
}

export const useHomeStore = create<HomeState>((set) => ({
  carousels: [],
  categories: [],
  homeSections: [],
  watchHistory: [],
  loading: true,
  error: false,

  fetchHomeData: async () => {
    try {
      set({ loading: true, error: false });

      const [carousels, genres, watchHistory, popularMovies, latestMovies] = await Promise.allSettled([
        getCarousels(),
        getGenres(),
        getContinueWatching(),
        getPopularMovies(1, 20),
        getLatestMovies(1, 20),
      ]);

      const resolvedCarousels = carousels.status === "fulfilled" ? carousels.value : [];
      const resolvedHistoryRaw = watchHistory.status === "fulfilled" ? watchHistory.value : [];
      const resolvedHistory = resolvedHistoryRaw
        .filter((item) => item.progress_percent >= 1 && item.progress_percent < 95)
        .reduce<WatchHistoryItem[]>((acc, item) => {
          if (acc.some((existing) => existing.content_id === item.content_id)) return acc;
          acc.push(item);
          return acc;
        }, [])
        .slice(0, 10);

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

      const popular = popularMovies.status === "fulfilled" ? popularMovies.value : [];
      const latest = latestMovies.status === "fulfilled" ? latestMovies.value : [];
      const randomGenrePool = [...resolvedCategories].sort(() => Math.random() - 0.5);
      const firstRandomGenre = randomGenrePool[0] ?? null;
      const secondRandomGenre = randomGenrePool[1] ?? null;

      const homeSections: HomeSection[] = [
        { id: "popular", title: "Popular", movies: popular, source: "popular" as const },
        ...(firstRandomGenre
          ? [{ id: firstRandomGenre.id, title: firstRandomGenre.title, movies: firstRandomGenre.movies, source: "genre" as const }]
          : []),
        ...(secondRandomGenre
          ? [{ id: secondRandomGenre.id, title: secondRandomGenre.title, movies: secondRandomGenre.movies, source: "genre" as const }]
          : []),
        { id: "latest", title: "Latest", movies: latest, source: "latest" as const },
      ].filter((section) => section.movies.length > 0);

      const hasAnyMainData = resolvedCarousels.length > 0 || homeSections.length > 0;

      set({
        carousels: resolvedCarousels,
        watchHistory: resolvedHistory,
        categories: resolvedCategories,
        homeSections,
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
