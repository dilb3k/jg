import {
  getTvCategories,
  getTvChannelDetail,
  getTvChannelEpg,
  getTvChannels,
  getTvCurrentProgram,
  getTvUpcomingPrograms,
} from "@/services/tv.service";
import {
  TvCategory,
  TvChannel,
  TvChannelDetail,
  TvChannelsPage,
  TvProgram,
} from "@/shared/types/tv";
import { AppLanguage } from "@/store/settings.store";
import { create } from "zustand";

interface TvState {
  categories: TvCategory[];
  selectedCategoryId: string | null;
  searchQuery: string;

  channels: TvChannel[];
  pagination: Omit<TvChannelsPage, "items">;
  loading: boolean;
  loadingMore: boolean;
  error: boolean;
  initialized: boolean;

  detail: TvChannelDetail | null;
  currentProgram: TvProgram | null;
  schedule: TvProgram[];
  upcoming: TvProgram[];
  selectedDate: string;
  detailLoading: boolean;
  detailError: boolean;

  channelsRequestId: number;
  detailRequestId: number;

  initialize: (language: AppLanguage) => Promise<void>;
  fetchCategories: (language: AppLanguage) => Promise<void>;
  fetchChannels: (language: AppLanguage, opts?: { reset?: boolean }) => Promise<void>;
  loadMore: (language: AppLanguage) => Promise<void>;

  setSelectedCategory: (language: AppLanguage, categoryId: string | null) => Promise<void>;
  setSearchQuery: (query: string) => void;

  openChannel: (language: AppLanguage, channelId: string) => Promise<void>;
  setScheduleDate: (language: AppLanguage, channelId: string, dateKey: string) => Promise<void>;

  clearTv: () => void;
}

const DEFAULT_PAGINATION: Omit<TvChannelsPage, "items"> = {
  total: 0,
  page: 1,
  per_page: 20,
  total_pages: 1,
};

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const toIsoRange = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map((part) => Number(part));
  const valid = Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d);
  const base = valid ? new Date(y, m - 1, d) : new Date();

  const start = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    0,
    0,
    0,
    0,
  );

  const end = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    23,
    59,
    59,
    999,
  );

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

const initialState = {
  categories: [] as TvCategory[],
  selectedCategoryId: null,
  searchQuery: "",

  channels: [] as TvChannel[],
  pagination: { ...DEFAULT_PAGINATION },
  loading: false,
  loadingMore: false,
  error: false,
  initialized: false,

  detail: null as TvChannelDetail | null,
  currentProgram: null as TvProgram | null,
  schedule: [] as TvProgram[],
  upcoming: [] as TvProgram[],
  selectedDate: toDateKey(new Date()),
  detailLoading: false,
  detailError: false,

  channelsRequestId: 0,
  detailRequestId: 0,
};

export const useTvStore = create<TvState>((set, get) => ({
  ...initialState,

  initialize: async (language) => {
    const { initialized } = get();
    if (initialized) return;

    await Promise.all([get().fetchCategories(language), get().fetchChannels(language, { reset: true })]);
    set({ initialized: true });
  },

  fetchCategories: async (language) => {
    try {
      const categories = await getTvCategories(language);
      set({ categories });
    } catch {
      set({ categories: [] });
    }
  },

  fetchChannels: async (language, opts) => {
    const state = get();
    const reset = opts?.reset ?? true;
    const nextRequestId = state.channelsRequestId + 1;

    set({
      channelsRequestId: nextRequestId,
      loading: reset,
      error: false,
      ...(reset ? { channels: [], pagination: { ...DEFAULT_PAGINATION } } : null),
    });

    try {
      const page = reset ? 1 : state.pagination.page;
      const response = await getTvChannels({
        language,
        page,
        perPage: state.pagination.per_page,
        categoryId: state.selectedCategoryId ?? undefined,
        search: state.searchQuery,
      });

      if (get().channelsRequestId !== nextRequestId) return;

      set({
        channels: response.items,
        pagination: {
          total: response.total,
          page: response.page,
          per_page: response.per_page,
          total_pages: response.total_pages,
        },
        loading: false,
        error: false,
      });
    } catch {
      if (get().channelsRequestId !== nextRequestId) return;
      set({
        loading: false,
        error: true,
      });
    }
  },

  loadMore: async (language) => {
    const state = get();
    if (state.loading || state.loadingMore) return;
    if (state.pagination.page >= state.pagination.total_pages) return;

    const nextPage = state.pagination.page + 1;
    set({ loadingMore: true });

    try {
      const response = await getTvChannels({
        language,
        page: nextPage,
        perPage: state.pagination.per_page,
        categoryId: state.selectedCategoryId ?? undefined,
        search: state.searchQuery,
      });

      set((prev) => ({
        channels: [...prev.channels, ...response.items],
        pagination: {
          total: response.total,
          page: response.page,
          per_page: response.per_page,
          total_pages: response.total_pages,
        },
        loadingMore: false,
      }));
    } catch {
      set({ loadingMore: false });
    }
  },

  setSelectedCategory: async (language, categoryId) => {
    set({ selectedCategoryId: categoryId });
    await get().fetchChannels(language, { reset: true });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  openChannel: async (language, channelId) => {
    const nextRequestId = get().detailRequestId + 1;
    const dateKey = get().selectedDate || toDateKey(new Date());
    const { startDate, endDate } = toIsoRange(dateKey);

    set({
      detailRequestId: nextRequestId,
      detailLoading: true,
      detailError: false,
      detail: null,
      currentProgram: null,
      schedule: [],
      upcoming: [],
    });

    try {
      const [detail, currentProgram, schedule, upcoming] = await Promise.allSettled([
        getTvChannelDetail(channelId, language),
        getTvCurrentProgram(channelId, language),
        getTvChannelEpg({ channelId, startDate, endDate, language }),
        getTvUpcomingPrograms(channelId, language),
      ]);

      if (get().detailRequestId !== nextRequestId) return;

      const resolvedDetail = detail.status === "fulfilled" ? detail.value : null;
      const resolvedCurrentProgram = currentProgram.status === "fulfilled" ? currentProgram.value : null;
      const resolvedSchedule = schedule.status === "fulfilled" ? schedule.value : [];
      const resolvedUpcoming = upcoming.status === "fulfilled" ? upcoming.value : [];

      set({
        detail: resolvedDetail,
        currentProgram: resolvedCurrentProgram ?? resolvedDetail?.current_program ?? null,
        schedule: resolvedSchedule,
        upcoming: resolvedUpcoming,
        detailLoading: false,
        detailError: resolvedDetail === null,
      });
    } catch {
      if (get().detailRequestId !== nextRequestId) return;
      set({
        detailLoading: false,
        detailError: true,
      });
    }
  },

  setScheduleDate: async (language, channelId, dateKey) => {
    const { startDate, endDate } = toIsoRange(dateKey);
    set({ selectedDate: dateKey, detailLoading: true, detailError: false });

    try {
      const schedule = await getTvChannelEpg({
        channelId,
        startDate,
        endDate,
        language,
      });

      set({ schedule, detailLoading: false });
    } catch {
      set({ schedule: [], detailLoading: false });
    }
  },

  clearTv: () => set({ ...initialState, selectedDate: toDateKey(new Date()) }),
}));

export const getTvDateKey = toDateKey;
