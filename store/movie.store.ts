import { getMovieById, MovieDetail } from "@/services/movie.service";
import { create } from "zustand";

interface MovieState {
  movie: MovieDetail | null;
  loading: boolean;
  error: boolean;
  fetchMovie: (id: string) => Promise<void>;
  clear: () => void;
}

export const useMovieStore = create<MovieState>((set) => ({
  movie: null,
  loading: true,
  error: false,

  fetchMovie: async (id) => {
    try {
      set({ loading: true, error: false });
      const movie = await getMovieById(id);
      set({ movie, loading: false, error: !movie });
    } catch {
      set({ movie: null, loading: false, error: true });
    }
  },

  clear: () => set({ movie: null, loading: true, error: false }),
}));
