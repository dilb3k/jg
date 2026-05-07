import "react-native-get-random-values";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

import { apiClient } from "../api/client";
import { getAppMeta, setAppMeta } from "../db/syncQueue";
import { STORAGE_KEYS } from "../constants";
import * as secureStorage from "../utils/secureStorage";
import { hasValidationErrors, validateProductInput } from "../utils/inventory";
import {
  getBusinessDate,
  isPastBusinessDate,
  isTodayBusinessDate,
} from "../utils/businessDay";
import type {
  AuthUser,
  Product,
  InventoryEntry,
  DailySnapshot,
  InventoryWithProduct,
  StatisticsData,
  SyncStatus,
  ProductInput,
} from "../types";

let latestInventoryLoadRequest = 0;

export const isPastDate = (date: string): boolean => isPastBusinessDate(date);
export const isToday = (date: string): boolean => isTodayBusinessDate(date);

const setOnlineStatus = (
  syncStatus: SyncStatus,
  isOnline: boolean,
): SyncStatus => ({
  ...syncStatus,
  isOnline,
});

const sanitizeProductImage = (
  image: string | undefined,
): string | undefined => {
  if (!image) return undefined;
  // Only allow data:image/... URLs or remote https://... URLs
  if (image.startsWith("data:image/") || image.startsWith("https://")) {
    return image;
  }
  // Block file://, content://, ph://, and other local URI schemes
  return undefined;
};

const stripInventoryProduct = (
  entry: InventoryEntry | InventoryWithProduct,
): InventoryEntry => {
  const { product: _product, ...rest } = entry as InventoryWithProduct &
    InventoryEntry;
  return rest;
};

const stripUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      (result as any)[key] = value;
    }
  });
  return result;
};

interface AppState {
  // Auth state
  user: AuthUser | null;
  isAuthenticated: boolean;

  // App state
  products: Product[];
  currentInventory: InventoryWithProduct[];
  snapshots: DailySnapshot[];
  isLoading: boolean;
  error: string | null;
  deviceId: string;
  syncStatus: SyncStatus;
  searchQuery: string;
  selectedDate: string;
  toast: {
    visible: boolean;
    message: string;
    type: "success" | "error" | "info";
  };

  // Auth actions
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;

  // App actions
  initialize: () => Promise<void>;
  refreshAppData: () => Promise<void>;
  loadProducts: () => Promise<void>;
  createProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (id: string, input: Partial<ProductInput>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  searchProducts: (query: string) => Promise<void>;

  loadInventoryByDate: (date: string) => Promise<void>;
  setStartInventory: (
    productId: string,
    date: string,
    quantity: number,
  ) => Promise<void>;
  setCurrentQuantity: (
    productId: string,
    date: string,
    quantity: number,
    note?: string,
  ) => Promise<void>;

  loadSnapshots: (from?: string, to?: string) => Promise<void>;
  getStatistics: (
    period: "daily" | "weekly" | "monthly" | "yearly",
    date?: string,
  ) => StatisticsData;
  buildAndSaveSnapshot: (date: string) => Promise<void>;

  syncNow: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: string) => void;
  clearError: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Auth state
  user: null,
  isAuthenticated: false,

  // App state
  products: [],
  currentInventory: [],
  snapshots: [],
  isLoading: false,
  error: null,
  deviceId: "",
  syncStatus: {
    isOnline: false,
    lastSyncAt: null,
    pendingCount: 0,
    isSyncing: false,
  },
  searchQuery: "",
  selectedDate: getBusinessDate(),
  toast: {
    visible: false,
    message: "",
    type: "info" as "success" | "error" | "info",
  },

  // Auth actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: async () => {
    apiClient.setToken(null);
    await secureStorage.deleteItemAsync(STORAGE_KEYS.USER_TOKEN);
    await secureStorage.deleteItemAsync(STORAGE_KEYS.AUTH_USER);
    set({
      user: null,
      isAuthenticated: false,
      products: [],
      currentInventory: [],
      snapshots: [],
    });
  },

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Load user from storage
      const userJson = await secureStorage.getItemAsync(STORAGE_KEYS.AUTH_USER);
      if (userJson) {
        const user: AuthUser = JSON.parse(userJson);
        set({ user, isAuthenticated: true });
      }

      let deviceId = await secureStorage.getItemAsync(STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        deviceId = uuidv4();
        await secureStorage.setItemAsync(STORAGE_KEYS.DEVICE_ID, deviceId);
      }

      const lastSyncAt = await getAppMeta(STORAGE_KEYS.LAST_SYNC);
      const businessDate = getBusinessDate();

      set({
        deviceId,
        selectedDate: businessDate,
        syncStatus: {
          isOnline: false,
          lastSyncAt,
          pendingCount: 0,
          isSyncing: false,
        },
      });

      await Promise.all([
        get().loadProducts(),
        get().loadInventoryByDate(businessDate),
        get().loadSnapshots(),
      ]);
    } catch (error: any) {
      set((state) => ({
        error: error.message || "Boshlashda xatolik yuz berdi",
        syncStatus: setOnlineStatus(state.syncStatus, false),
      }));
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  refreshAppData: async () => {
    const activeDate = get().selectedDate || getBusinessDate();

    try {
      set({ isLoading: true, error: null });
      await get().syncNow();
      await Promise.all([
        get().loadProducts(),
        get().loadSnapshots(),
        get().loadInventoryByDate(activeDate),
      ]);
    } catch (error: any) {
      set((state) => ({
        error: error.message || "Yangilashda xatolik yuz berdi",
        syncStatus: setOnlineStatus(state.syncStatus, false),
      }));
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadProducts: async () => {
    try {
      const searchQuery = get().searchQuery.trim();
      const products = await apiClient.getProducts(searchQuery || undefined);

      set((state) => ({
        products: products.filter((product) => !product.isDeleted),
        syncStatus: setOnlineStatus(state.syncStatus, true),
      }));
    } catch (error: any) {
      set((state) => ({
        error: error.message || "Mahsulotlar yuklanmadi",
        syncStatus: setOnlineStatus(state.syncStatus, false),
      }));
    }
  },

  createProduct: async (input) => {
    const validationErrors = validateProductInput(input);
    if (hasValidationErrors(validationErrors)) {
      throw new Error(
        Object.values(validationErrors).find(Boolean) ||
          "Mahsulot ma'lumoti noto'g'ri",
      );
    }

    let { deviceId } = get();
    if (!deviceId) {
      deviceId = uuidv4();
      await secureStorage.setItemAsync(STORAGE_KEYS.DEVICE_ID, deviceId);
      set({ deviceId });
    }

    const now = new Date().toISOString();
    const product: Product = {
      id: uuidv4(),
      localId: uuidv4(),
      deviceId,
      name: input.name.trim(),
      quantity: Number(input.quantity ?? 0),
      buyPrice: Number(input.buyPrice),
      sellPrice: Number(input.sellPrice),
      image: sanitizeProductImage(input.image),
      isDeleted: false,
      updatedAt: now,
      createdAt: now,
    };

    const created = await apiClient.createProduct(product);

    await Promise.all([
      get().loadProducts(),
      get().loadInventoryByDate(get().selectedDate || getBusinessDate()),
    ]);

    return created;
  },

  updateProduct: async (localId, input) => {
    const existing = get().products.find(
      (product) => product.localId === localId,
    );
    if (!existing) return;

    const validationErrors = validateProductInput({ ...existing, ...input });
    if (hasValidationErrors(validationErrors)) {
      throw new Error(
        Object.values(validationErrors).find(Boolean) ||
          "Mahsulot ma'lumoti noto'g'ri",
      );
    }

    const updatedProduct: Partial<Product> = {
      ...stripUndefined(input),
      updatedAt: new Date().toISOString(),
    };

    await apiClient.updateProduct(localId, updatedProduct);

    await Promise.all([
      get().loadProducts(),
      get().loadInventoryByDate(get().selectedDate || getBusinessDate()),
      get().loadSnapshots(),
    ]);
  },

  deleteProduct: async (localId) => {
    try {
      await apiClient.deleteProduct(localId);
      await Promise.all([
        get().loadProducts(),
        get().loadInventoryByDate(get().selectedDate || getBusinessDate()),
        get().loadSnapshots(),
      ]);
    } catch (error: any) {
      set((state) => ({
        error: error.message || "Mahsulot o'chirilmadi",
        syncStatus: setOnlineStatus(state.syncStatus, false),
      }));
      throw error;
    }
  },

  searchProducts: async (query) => {
    set({ searchQuery: query });
    await get().loadProducts();
  },

  loadInventoryByDate: async (date) => {
    try {
      const requestId = ++latestInventoryLoadRequest;
      const inventory = await apiClient.getInventoryWithProducts(date);

      if (requestId !== latestInventoryLoadRequest) {
        return;
      }

      set((state) => ({
        currentInventory: inventory,
        selectedDate: date,
        syncStatus: setOnlineStatus(state.syncStatus, true),
      }));
    } catch (error: any) {
      set((state) => ({
        error: error.message || "Ombor ma'lumotlari yuklanmadi",
        syncStatus: setOnlineStatus(state.syncStatus, false),
      }));
    }
  },

  setStartInventory: async (productId, date, quantity) => {
    if (isPastDate(date)) {
      throw new Error("O'tgan kunlar uchun o'zgartirish kiritib bo'lmaydi!");
    }

    const { currentInventory, deviceId } = get();
    const now = new Date().toISOString();
    const existing = currentInventory.find(
      (entry) => entry.productId === productId && entry.date === date,
    );

    const soldSoFar = existing
      ? Math.max(existing.startQuantity - existing.currentQuantity, 0)
      : 0;

    if (quantity < soldSoFar) {
      throw new Error(
        `Boshlang'ich miqdor ${soldSoFar} tadan kam bo'lolmaydi (${soldSoFar} ta allaqachon sotilgan)`,
      );
    }

    const entry: InventoryEntry = {
      id: existing?.id,
      localId: existing?.localId || `${date}-${productId}`,
      deviceId: existing?.deviceId || deviceId,
      productId,
      date,
      startQuantity: quantity,
      currentQuantity: quantity - soldSoFar,
      note: existing?.note || "",
      isDeleted: false,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };

    await apiClient.startDayInventory(
      entry.deviceId,
      [
        {
          productId: entry.productId,
          startQuantity: entry.startQuantity,
          currentQuantity: entry.currentQuantity,
          note: entry.note,
          localId: entry.localId,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        },
      ],
      entry.date,
    );
    await get().loadInventoryByDate(date);
    await get().buildAndSaveSnapshot(date);
    await get().loadSnapshots();
  },

  setCurrentQuantity: async (productId, date, quantity, note) => {
    if (isPastDate(date)) {
      throw new Error("O'tgan kunlar uchun o'zgartirish kiritib bo'lmaydi!");
    }

    const existing = get().currentInventory.find(
      (entry) => entry.productId === productId && entry.date === date,
    );
    if (!existing) return;

    const safeQuantity = Math.min(
      Math.max(quantity, 0),
      existing.currentQuantity,
    );
    const now = new Date().toISOString();

    const updatedEntry: InventoryEntry = {
      ...stripInventoryProduct(existing),
      currentQuantity: safeQuantity,
      note: note || existing.note,
      updatedAt: now,
    };

    await apiClient.bulkUpdateInventory(
      updatedEntry.deviceId,
      [
        {
          productId: updatedEntry.productId,
          currentQuantity: updatedEntry.currentQuantity,
          note: updatedEntry.note,
        },
      ],
      updatedEntry.date,
    );
    await apiClient.updateProduct(existing.productId, {
      quantity: safeQuantity,
      updatedAt: now,
    });

    await get().buildAndSaveSnapshot(date);

    await Promise.all([
      get().loadInventoryByDate(date),
      get().loadProducts(),
      get().loadSnapshots(),
    ]);
  },

  loadSnapshots: async (from, to) => {
    try {
      const snapshots =
        from && to
          ? await apiClient.getSnapshotsRange(from, to)
          : await apiClient.getSnapshotsRange("1970-01-01", getBusinessDate());

      set((state) => ({
        snapshots,
        syncStatus: setOnlineStatus(state.syncStatus, true),
      }));
    } catch (error: any) {
      set((state) => ({
        error: error.message || "Snapshotlar yuklanmadi",
        syncStatus: setOnlineStatus(state.syncStatus, false),
      }));
    }
  },

  getStatistics: (period, date) => {
    const { snapshots } = get();
    const targetDate = date || getBusinessDate();

    if (period === "daily") {
      const filtered = snapshots.filter(
        (snapshot) => snapshot.date === targetDate,
      );
      return {
        date: targetDate,
        totalRevenue: filtered.reduce(
          (sum, item) => sum + item.totalRevenue,
          0,
        ),
        totalProfit: filtered.reduce((sum, item) => sum + item.totalProfit, 0),
        totalSoldItems: filtered.reduce(
          (sum, item) => sum + item.totalSoldItems,
          0,
        ),
        items: filtered.flatMap((item) => item.items),
      };
    }

    const ranges: Record<
      Exclude<typeof period, "daily">,
      [dayjs.Dayjs, dayjs.Dayjs]
    > = {
      weekly: [
        dayjs(targetDate).startOf("week"),
        dayjs(targetDate).endOf("week"),
      ],
      monthly: [
        dayjs(targetDate).startOf("month"),
        dayjs(targetDate).endOf("month"),
      ],
      yearly: [
        dayjs(targetDate).startOf("year"),
        dayjs(targetDate).endOf("year"),
      ],
    };
    const [from, to] = ranges[period];

    const filtered = snapshots.filter((snapshot) => {
      const snapshotDate = dayjs(snapshot.date);
      return !snapshotDate.isBefore(from) && !snapshotDate.isAfter(to);
    });

    return {
      date: targetDate,
      totalRevenue: filtered.reduce((sum, item) => sum + item.totalRevenue, 0),
      totalProfit: filtered.reduce((sum, item) => sum + item.totalProfit, 0),
      totalSoldItems: filtered.reduce(
        (sum, item) => sum + item.totalSoldItems,
        0,
      ),
      items: filtered.flatMap((item) => item.items),
    };
  },

  buildAndSaveSnapshot: async (date) => {
    const { deviceId, currentInventory, snapshots } = get();
    const inventory =
      get().selectedDate === date
        ? currentInventory
        : await apiClient.getInventoryWithProducts(date);
    const existing =
      snapshots.find((snapshot) => snapshot.date === date) || null;

    const historicalPrices = new Map(
      (existing?.items || []).map((item) => [
        item.productId,
        {
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice,
        },
      ]),
    );

    const items = inventory
      .map((entry) => {
        const sold = Math.max(entry.startQuantity - entry.currentQuantity, 0);
        const previousPrices = historicalPrices.get(entry.productId);
        const buyPrice = previousPrices?.buyPrice ?? entry.product.buyPrice;
        const sellPrice = previousPrices?.sellPrice ?? entry.product.sellPrice;

        return {
          productId: entry.productId,
          productName: entry.product.name,
          sold,
          buyPrice,
          sellPrice,
          revenue: sold * sellPrice,
          profit: sold * (sellPrice - buyPrice),
        };
      })
      .filter((item) => item.sold > 0);

    const now = new Date().toISOString();
    const snapshot: DailySnapshot = {
      id: existing?.id || uuidv4(),
      localId: existing?.localId || `snapshot-${date}-${deviceId}`,
      deviceId,
      date,
      totalRevenue: items.reduce((sum, item) => sum + item.revenue, 0),
      totalProfit: items.reduce((sum, item) => sum + item.profit, 0),
      totalSoldItems: items.reduce((sum, item) => sum + item.sold, 0),
      items,
      isDeleted: false,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };

    await apiClient.createDailySnapshot(snapshot);
  },

  syncNow: async () => {
    if (get().syncStatus.isSyncing) return;

    set((state) => ({
      syncStatus: { ...state.syncStatus, isSyncing: true },
    }));

    try {
      const { products, currentInventory, snapshots, selectedDate } = get();
      const result = await apiClient.sync({
        products: products.map((p) => ({
          ...p,
          image: sanitizeProductImage(p.image),
        })),
        inventory: currentInventory.map(stripInventoryProduct),
        snapshots,
        lastSyncAt: get().syncStatus.lastSyncAt || undefined,
      });
      const now = result.serverTime || new Date().toISOString();

      await setAppMeta(STORAGE_KEYS.LAST_SYNC, now);

      set((state) => ({
        syncStatus: {
          ...setOnlineStatus(state.syncStatus, true),
          lastSyncAt: now,
          pendingCount: 0,
          isSyncing: false,
        },
      }));

      await Promise.all([
        get().loadProducts(),
        get().loadSnapshots(),
        get().loadInventoryByDate(selectedDate || getBusinessDate()),
      ]);
    } catch (error: any) {
      set((state) => ({
        error: error.message || "Sync bajarilmadi",
        syncStatus: {
          ...setOnlineStatus(state.syncStatus, false),
          isSyncing: false,
        },
      }));
      throw error;
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  clearError: () => set({ error: null }),

  showToast: (message, type = "info") => {
    set({ toast: { visible: true, message, type } });
    setTimeout(
      () => set({ toast: { visible: false, message: "", type: "info" } }),
      3000,
    );
  },

  hideToast: () =>
    set({ toast: { visible: false, message: "", type: "info" } }),
}));
