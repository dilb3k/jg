import {
  getCountries,
  getSearchGenres,
  searchContent,
} from "@/services/search.service";
import {
  SearchCountry,
  SearchFilters,
  SearchGenre,
  SearchItem,
  SearchPagination,
} from "@/shared/types/search";
import { AppLanguage } from "@/store/settings.store";
import { create } from "zustand";

interface SearchState {
  query: string;
  filters: SearchFilters;
  draftFilters: SearchFilters;
  results: SearchItem[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: boolean;
  pagination: SearchPagination;
  genres: SearchGenre[];
  countries: SearchCountry[];
  optionsLoading: boolean;
  initialized: boolean;
  requestId: number;

  setQuery: (query: string) => void;
  updateFilters: (patch: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  startFilterDraft: () => void;
  updateDraftFilters: (patch: Partial<SearchFilters>) => void;
  setDraftGenreIds: (ids: string[]) => void;
  setDraftCountryIds: (ids: string[]) => void;
  resetDraftFilters: () => void;
  applyDraftFilters: () => void;
  discardDraftFilters: () => void;
  fetchOptions: (language: AppLanguage) => Promise<void>;
  fetchSearch: (language: AppLanguage, opts?: { reset?: boolean }) => Promise<void>;
  loadMore: (language: AppLanguage) => Promise<void>;
  clearSearch: () => void;
}

const DEFAULT_FILTERS: SearchFilters = {
  type: "all",
  genreIds: [],
  countryIds: [],
  hasSubtitle: false,
  quality: undefined,
  ratingFrom: undefined,
  ratingTo: undefined,
  yearFrom: undefined,
  yearTo: undefined,
  sortBy: undefined,
};

const DEFAULT_PAGINATION: SearchPagination = {
  page: 1,
  per_page: 20,
  total: 0,
  total_pages: 1,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  filters: { ...DEFAULT_FILTERS },
  draftFilters: { ...DEFAULT_FILTERS },
  results: [],
  loading: false,
  refreshing: false,
  loadingMore: false,
  error: false,
  pagination: { ...DEFAULT_PAGINATION },
  genres: [],
  countries: [],
  optionsLoading: false,
  initialized: false,
  requestId: 0,

  setQuery: (query) => set({ query }),

  updateFilters: (patch) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...patch,
      },
    }));
  },

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  startFilterDraft: () =>
    set((state) => ({
      draftFilters: { ...state.filters },
    })),

  updateDraftFilters: (patch) =>
    set((state) => ({
      draftFilters: {
        ...state.draftFilters,
        ...patch,
      },
    })),

  setDraftGenreIds: (ids) =>
    set((state) => ({
      draftFilters: {
        ...state.draftFilters,
        genreIds: ids,
      },
    })),

  setDraftCountryIds: (ids) =>
    set((state) => ({
      draftFilters: {
        ...state.draftFilters,
        countryIds: ids,
      },
    })),

  resetDraftFilters: () => set({ draftFilters: { ...DEFAULT_FILTERS } }),

  applyDraftFilters: () =>
    set((state) => ({
      filters: { ...state.draftFilters },
    })),

  discardDraftFilters: () =>
    set((state) => ({
      draftFilters: { ...state.filters },
    })),

  fetchOptions: async (language) => {
    const { optionsLoading, genres, countries } = get();
    if (optionsLoading || (genres.length > 0 && countries.length > 0)) return;

    set({ optionsLoading: true });

    try {
      const [genresData, countriesData] = await Promise.all([
        getSearchGenres(language),
        getCountries(language),
      ]);

      set({
        genres: genresData,
        countries: countriesData,
      });
    } finally {
      set({ optionsLoading: false });
    }
  },

  fetchSearch: async (language, opts) => {
    const state = get();
    const reset = opts?.reset ?? true;
    const currentRequestId = state.requestId + 1;

    set({
      requestId: currentRequestId,
      loading: reset,
      refreshing: !reset,
      error: false,
      ...(reset ? { results: [], pagination: { ...DEFAULT_PAGINATION } } : null),
    });

    try {
      const response = await searchContent({
        language,
        q: state.query,
        page: 1,
        perPage: state.pagination.per_page,
        filters: state.filters,
      });

      if (get().requestId !== currentRequestId) return;

      set({
        results: response.items,
        pagination: response.pagination,
        loading: false,
        refreshing: false,
        error: false,
        initialized: true,
      });
    } catch {
      if (get().requestId !== currentRequestId) return;

      set({
        loading: false,
        refreshing: false,
        error: true,
        initialized: true,
      });
    }
  },

  loadMore: async (language) => {
    const state = get();

    if (state.loading || state.loadingMore || state.refreshing) return;
    if (state.pagination.page >= state.pagination.total_pages) return;

    const nextPage = state.pagination.page + 1;
    set({ loadingMore: true });

    try {
      const response = await searchContent({
        language,
        q: state.query,
        page: nextPage,
        perPage: state.pagination.per_page,
        filters: state.filters,
      });

      set((prev) => ({
        results: [...prev.results, ...response.items],
        pagination: response.pagination,
        loadingMore: false,
      }));
    } catch {
      set({ loadingMore: false });
    }
  },

  clearSearch: () =>
    set({
      query: "",
      results: [],
      error: false,
      loading: false,
      refreshing: false,
      loadingMore: false,
      pagination: { ...DEFAULT_PAGINATION },
      filters: { ...DEFAULT_FILTERS },
      draftFilters: { ...DEFAULT_FILTERS },
      initialized: false,
    }),
}));

export const searchDefaultFilters: SearchFilters = { ...DEFAULT_FILTERS };
