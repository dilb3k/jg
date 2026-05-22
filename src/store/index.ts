import "react-native-get-random-values";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

import { apiClient, setConnectionMode } from "../api/client";
import { getAppMeta, setAppMeta, getSyncQueueCount } from "../db/syncQueue";
import { STORAGE_KEYS } from "../constants";
import * as secureStorage from "../utils/secureStorage";
import { hasValidationErrors, validateProductInput } from "../utils/inventory";
import {
  getBusinessDate,
  getBusinessDayStartHour,
  setBusinessDayStartHour,
  scheduleBusinessDayStartHour,
  setPendingBusinessDayHour,
  getEffectiveFrom,
  isPastBusinessDate,
  isTodayBusinessDate,
} from "../utils/businessDay";
import type {
  AuthUser,
  Product,
  InventoryEntry,
  DailySnapshot,
  InventorySummary,
  InventoryWithProduct,
  StatisticsData,
  SyncStatus,
  ProductInput,
} from "../types";

let latestInventoryLoadRequest = 0;
const inflightKeys = new Set<string>();
let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

function sortByDisplayIndex(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const indexA = a.displayIndex ?? 0;
    const indexB = b.displayIndex ?? 0;
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return a.name.localeCompare(b.name);
  });
}

export const isPastDate = (date: string): boolean => isPastBusinessDate(date);
export const isToday = (date: string): boolean => isTodayBusinessDate(date);

const setOnlineStatus = (
  syncStatus: SyncStatus,
  isOnline: boolean,
): SyncStatus => ({
  ...syncStatus,
  isOnline,
});

const IMAGE_HASH_REGEX = /^[a-f0-9]{64}$/;

const sanitizeProductImage = (
  image: string | undefined,
): string | undefined => {
  if (!image) return undefined;
  if (image.startsWith("data:image/") || image.startsWith("https://") || image.startsWith("http://") || IMAGE_HASH_REGEX.test(image)) {
    return image;
  }
  return undefined;
};

const stripInventoryProduct = (
  entry: InventoryEntry | InventoryWithProduct,
): InventoryEntry => {
  const { product: _product, ...rest } = entry as InventoryWithProduct &
    InventoryEntry;
  return rest;
};

const syncInventoryProductRefs = (
  inventory: InventoryWithProduct[],
  productId: string,
  updates: Partial<Product>,
): InventoryWithProduct[] => {
  if (!inventory.length) return inventory;
  return inventory.map((entry) =>
    entry.productId === productId
      ? { ...entry, product: { ...entry.product, ...updates } }
      : entry,
  );
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
  inventorySummary: InventorySummary | null;
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
  applySales: (
    date: string,
    lines: { productId: string; quantity: number }[],
  ) => Promise<void>;
  getStatistics: (
    period: "daily" | "weekly" | "monthly" | "yearly",
    date?: string,
  ) => StatisticsData;
  buildAndSaveSnapshot: (date: string) => Promise<void>;

  syncNow: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: string) => void;
  setBusinessDayHour: (hour: number) => Promise<void>;
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
  inventorySummary: null,
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
  setUser: (user) => {
    const normalized = user
      ? {
          ...user,
          isPayed:
            user.role?.toLowerCase() === "superadmin"
              ? true
              : (user as any).isPayed ?? false,
        }
      : user;
    set({ user: normalized, isAuthenticated: !!normalized });
    if (normalized && typeof normalized.businessDayStartHour === 'number' && normalized.businessDayStartHour >= 0 && normalized.businessDayStartHour <= 23) {
      setBusinessDayStartHour(normalized.businessDayStartHour);
    }
  },

  logout: async () => {
    apiClient.setToken(null);
    await secureStorage.deleteItemAsync(STORAGE_KEYS.USER_TOKEN);
    await secureStorage.deleteItemAsync(STORAGE_KEYS.AUTH_USER);
    const { clearAllProducts } = await import("../db/products");
    const { clearAllInventory } = await import("../db/inventory");
    const { clearAllSnapshots } = await import("../db/snapshots");
    const { clearAllSyncQueue } = await import("../db/syncQueue");
    await Promise.all([
      clearAllProducts(),
      clearAllInventory(),
      clearAllSnapshots(),
      clearAllSyncQueue(),
    ]);
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

      const savedConnectionMode = await secureStorage.getItemAsync(STORAGE_KEYS.CONNECTION_MODE);
      if (savedConnectionMode === "online" || savedConnectionMode === "offline") {
        setConnectionMode(savedConnectionMode);
      }

      const savedHour = await secureStorage.getItemAsync(STORAGE_KEYS.BUSINESS_DAY_START_HOUR);
      if (savedHour) {
        const parsed = Number(savedHour);
        if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 23) {
          setBusinessDayStartHour(parsed);
        }
      }

      const pendingHourStr = await secureStorage.getItemAsync(STORAGE_KEYS.PENDING_BUSINESS_DAY_HOUR);
      const effectiveFromStr = await secureStorage.getItemAsync(STORAGE_KEYS.BUSINESS_DAY_EFFECTIVE_FROM);
      if (pendingHourStr && effectiveFromStr) {
        const ph = Number(pendingHourStr);
        if (Number.isInteger(ph) && ph >= 0 && ph <= 23) {
          setPendingBusinessDayHour(ph, effectiveFromStr);
        }
      }

      const userJson = await secureStorage.getItemAsync(STORAGE_KEYS.AUTH_USER);
      if (userJson) {
        const user: AuthUser = JSON.parse(userJson);
        set({ user, isAuthenticated: true });
        if (typeof user.businessDayStartHour === 'number' && user.businessDayStartHour >= 0 && user.businessDayStartHour <= 23) {
          setBusinessDayStartHour(user.businessDayStartHour);
        }
      }

      let deviceId = await secureStorage.getItemAsync(STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        deviceId = uuidv4();
        await secureStorage.setItemAsync(STORAGE_KEYS.DEVICE_ID, deviceId);
      }

      const lastSyncAt = await getAppMeta(STORAGE_KEYS.LAST_SYNC);
      const businessDate = getBusinessDate();
      const pendingCount = await getSyncQueueCount();

      set({
        deviceId,
        selectedDate: businessDate,
        syncStatus: {
          isOnline: false,
          lastSyncAt,
          pendingCount,
          isSyncing: false,
        },
      });

      await get().loadProducts();

      const authedUser = get().user;
      const isPaidOrSuper =
        authedUser?.role?.toLowerCase() === "superadmin" || authedUser?.isPayed;
      await Promise.all([
        get().loadInventoryByDate(businessDate),
        isPaidOrSuper ? get().loadSnapshots() : Promise.resolve(),
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
    try {
      set({ isLoading: true, error: null });
      await get().syncNow();
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
    const searchQuery = get().searchQuery.trim();
    const cacheKey = `products:${searchQuery || '__all'}`;
    if (inflightKeys.has(cacheKey)) return;
    inflightKeys.add(cacheKey);
     try {
       const products = await apiClient.getProducts(searchQuery || undefined);
       const sortedProducts = sortByDisplayIndex(products);

       set((state) => ({
         products: sortedProducts,
         syncStatus: setOnlineStatus(state.syncStatus, true),
       }));
     } catch (error: any) {
      set((state) => ({
        error: error.message || "Mahsulotlar yuklanmadi",
        syncStatus: setOnlineStatus(state.syncStatus, false),
      }));
    } finally {
      inflightKeys.delete(cacheKey);
    }
  },

  createProduct: async (input) => {
    const user = get().user;
    const isPaid =
      user?.role?.toLowerCase() === "superadmin" || user?.isPayed;
    if (!isPaid) {
      throw new Error("Mahsulot qo'shish uchun premium obuna kerak");
    }

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
    const user = get().user;
    const isPaid =
      user?.role?.toLowerCase() === "superadmin" || user?.isPayed;

    const existing = get().products.find(
      (product) => product.localId === localId,
    );
    if (!existing) return;

    const inputKeys = Object.keys(stripUndefined(input));
    const isQuantityOnlyUpdate =
      inputKeys.length === 1 && inputKeys[0] === "quantity";

    if (!isPaid && !isQuantityOnlyUpdate) {
      throw new Error("Mahsulotni tahrirlash uchun premium obuna kerak");
    }

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

    set((state) => ({
      currentInventory: syncInventoryProductRefs(
        state.currentInventory,
        localId,
        updatedProduct,
      ),
    }));

    await Promise.all([
      get().loadProducts(),
      get().loadInventoryByDate(get().selectedDate || getBusinessDate()),
    ]);
  },

  deleteProduct: async (localId) => {
    const user = get().user;
    const isPaid =
      user?.role?.toLowerCase() === "superadmin" || user?.isPayed;
    if (!isPaid) {
      throw new Error("Mahsulotni o'chirish uchun premium obuna kerak");
    }

    try {
      await apiClient.deleteProduct(localId);

      set((state) => ({
        currentInventory: syncInventoryProductRefs(
          state.currentInventory,
          localId,
          {} as Partial<Product>,
        ),
      }));

      await Promise.all([
        get().loadProducts(),
        get().loadInventoryByDate(get().selectedDate || getBusinessDate()),
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
    const dateKey = `inv:${date}`;
    if (inflightKeys.has(dateKey)) return;
    inflightKeys.add(dateKey);
    try {
      const requestId = ++latestInventoryLoadRequest;
      const result = await apiClient.getInventoryWithProducts({ date });

      if (requestId !== latestInventoryLoadRequest) {
        return;
      }

      set((state) => ({
        currentInventory: result.items,
        inventorySummary: result.summary ?? null,
        selectedDate: date,
        syncStatus: setOnlineStatus(state.syncStatus, true),
      }));
    } catch (error: any) {
      set((state) => ({
        error: error.message || "Ombor ma'lumotlari yuklanmadi",
        syncStatus: setOnlineStatus(state.syncStatus, false),
      }));
    } finally {
      inflightKeys.delete(dateKey);
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

    set((state) => ({
      currentInventory: state.currentInventory.map((e) =>
        e.productId === productId && e.date === date
          ? {
              ...e,
              startQuantity: quantity,
              currentQuantity: quantity - soldSoFar,
              updatedAt: now,
              product: { ...e.product, quantity: quantity, updatedAt: now },
            }
          : e,
      ),
    }));

    await Promise.all([
      get().loadProducts(),
      get().loadInventoryByDate(date),
    ]);

    await get().buildAndSaveSnapshot(date);
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
      existing.startQuantity,
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

    set((state) => ({
      currentInventory: state.currentInventory.map((entry) =>
        entry.productId === productId && entry.date === date
          ? {
              ...entry,
              currentQuantity: safeQuantity,
              note: note || entry.note,
              updatedAt: now,
              product: { ...entry.product, quantity: safeQuantity, updatedAt: now },
            }
          : entry,
      ),
      products: state.products.map((p) =>
        p.localId === productId
          ? { ...p, quantity: safeQuantity, updatedAt: now }
          : p,
      ),
    }));

    await Promise.all([
      get().loadProducts(),
      get().loadInventoryByDate(date),
    ]);

    await get().buildAndSaveSnapshot(date);
  },

  loadSnapshots: async (from, to) => {
    const user = get().user;
    const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";
    if (!isSuperAdmin && !user?.isPayed) {
      set((state) => ({
        syncStatus: setOnlineStatus(state.syncStatus, false),
      }));
      return;
    }
    const cacheKey = `snapshots:${from || '__all'}:${to || '__all'}`;
    if (inflightKeys.has(cacheKey)) return;
    inflightKeys.add(cacheKey);
    try {
      const effectiveFrom = from;
      const effectiveTo = to || get().selectedDate || getBusinessDate();

      const snapshots = effectiveFrom
        ? await apiClient.getSnapshotsRange(effectiveFrom, effectiveTo)
        : await apiClient.getSnapshotsRange("1970-01-01", effectiveTo);

      set((state) => ({
        snapshots,
        syncStatus: setOnlineStatus(state.syncStatus, true),
      }));
    } catch (error: any) {
      set((state) => ({
        error: error.message || "Snapshotlar yuklanmadi",
        syncStatus: setOnlineStatus(state.syncStatus, false),
      }));
    } finally {
      inflightKeys.delete(cacheKey);
    }
  },

  applySales: async (date, lines) => {
    if (isPastDate(date)) {
      throw new Error("O'tgan kunlar uchun savdo kiritib bo'lmaydi!");
    }

    let { deviceId, currentInventory } = get();
    if (!deviceId) {
      deviceId = uuidv4();
      await secureStorage.setItemAsync(STORAGE_KEYS.DEVICE_ID, deviceId);
      set({ deviceId });
    }
    const salesByProduct = new Map<string, number>();

    for (const line of lines) {
      if (line.quantity <= 0) continue;
      salesByProduct.set(
        line.productId,
        (salesByProduct.get(line.productId) ?? 0) + line.quantity,
      );
    }

    const items: { productId: string; currentQuantity: number; note?: string }[] = [];

    for (const [productId, totalQuantity] of salesByProduct) {
      const entry =
        currentInventory.find(
          (e) => e.productId === productId && e.date === date,
        ) ??
        currentInventory.find((e) => e.productId === productId);
      if (!entry) {
        const product = get().products.find((p) => p.localId === productId);
        if (!product) continue;
        const now = new Date().toISOString();
        const newEntry: InventoryEntry = {
          localId: `${date}-${product.localId}`,
          deviceId: deviceId,
          productId: product.localId,
          date,
          startQuantity: totalQuantity,
          currentQuantity: Math.max(0, product.quantity - totalQuantity),
          note: "",
          updatedAt: now,
          createdAt: now,
        };
        await apiClient.startDayInventory(deviceId, [{
          productId: newEntry.productId,
          startQuantity: newEntry.startQuantity,
          currentQuantity: newEntry.currentQuantity,
          localId: newEntry.localId,
          createdAt: newEntry.createdAt,
          updatedAt: newEntry.updatedAt,
        }], date);
        continue;
      }
      const newCurrent = Math.max(0, entry.currentQuantity - totalQuantity);
      if (newCurrent === entry.currentQuantity) continue;
      items.push({
        productId,
        currentQuantity: newCurrent,
        note: entry.note,
      });
    }

    if (!items.length) return;

    await apiClient.bulkUpdateInventory(deviceId, items, date);

    await Promise.all([get().loadProducts(), get().loadInventoryByDate(date)]);

    await get().buildAndSaveSnapshot(date);
    await get().loadSnapshots();
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
        dayjs(targetDate).startOf("week").add(1, "day"),
        dayjs(targetDate).endOf("week").add(1, "day"),
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
    const { deviceId, snapshots } = get();
    const inventory = (await apiClient.getInventoryWithProducts({ date })).items;
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
        const buyPrice = entry.product.buyPrice ?? previousPrices?.buyPrice ?? 0;
        const sellPrice = entry.product.sellPrice ?? previousPrices?.sellPrice ?? 0;

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
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };

    const savedSnapshot = await apiClient.createDailySnapshot(snapshot);

    set((state) => {
      const existingIndex = state.snapshots.findIndex(
        (s) => s.date === date,
      );
      const newSnapshots = [...state.snapshots];
      if (existingIndex >= 0) {
        newSnapshots[existingIndex] = savedSnapshot;
      } else {
        newSnapshots.push(savedSnapshot);
      }
      return { snapshots: newSnapshots };
    });
  },

  syncNow: async () => {
    if (get().syncStatus.isSyncing) return;

    set((state) => ({
      syncStatus: { ...state.syncStatus, isSyncing: true },
    }));

    try {
      const { selectedDate } = get();
      const { getAllProducts } = await import("../db/products");
      const { getAllInventoryEntries } = await import("../db/inventory");
      const allProducts = await getAllProducts();
      const allInventory = await getAllInventoryEntries();

      await apiClient.processSyncQueue();

      const result = await apiClient.sync({
        products: allProducts.map((p) => ({
          ...p,
          image: sanitizeProductImage(p.image),
        })),
        inventory: allInventory.map(stripInventoryProduct),
        lastSyncAt: get().syncStatus.lastSyncAt || undefined,
      });
      const now = result.serverTime || new Date().toISOString();

      await setAppMeta(STORAGE_KEYS.LAST_SYNC, now);

      const newPendingCount = await getSyncQueueCount();

      set((state) => ({
        syncStatus: {
          ...setOnlineStatus(state.syncStatus, true),
          lastSyncAt: now,
          pendingCount: newPendingCount,
          isSyncing: false,
        },
      }));

      await Promise.all([
        get().loadProducts(),
        get().loadInventoryByDate(selectedDate || getBusinessDate()),
        get().loadSnapshots(),
      ]);
    } catch (error: any) {
      const pendingCount = await getSyncQueueCount();
      set((state) => ({
        error: error.message || "Sync bajarilmadi",
        syncStatus: {
          ...setOnlineStatus(state.syncStatus, false),
          pendingCount,
          isSyncing: false,
        },
      }));
      throw error;
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  clearError: () => set({ error: null }),

  setBusinessDayHour: async (hour: number) => {
    const clamped = Math.min(Math.max(Math.round(hour), 0), 23);
    scheduleBusinessDayStartHour(clamped);
    await secureStorage.setItemAsync(STORAGE_KEYS.PENDING_BUSINESS_DAY_HOUR, String(clamped));
    await secureStorage.setItemAsync(STORAGE_KEYS.BUSINESS_DAY_EFFECTIVE_FROM, getEffectiveFrom() || "");

    try {
      const result = await apiClient.updateMe({ businessDayStartHour: clamped });
      if (result.token) {
        await secureStorage.setItemAsync(STORAGE_KEYS.USER_TOKEN, result.token);
      }
      if (result.user) {
        const mergedUser = { ...result.user, businessDayStartHour: result.user.businessDayStartHour ?? getBusinessDayStartHour() };
        set({ user: mergedUser });
        await secureStorage.setItemAsync(STORAGE_KEYS.AUTH_USER, JSON.stringify(mergedUser));
      }
    } catch {
      // Server update is best-effort
    }

    const effectiveDate = dayjs(getEffectiveFrom()).format("DD.MM.YYYY HH:mm");
    const message = `Ish kuni boshlanish vaqti ${String(clamped).padStart(2, "0")}:00 ga o'zgartirildi. ${effectiveDate} dan kuchga kiradi.`;
    get().showToast(message, "info");
  },

  showToast: (message, type = "info") => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    set({ toast: { visible: true, message, type } });
    toastTimeoutId = setTimeout(
      () => {
        set({ toast: { visible: false, message: "", type: "info" } });
        toastTimeoutId = null;
      },
      3000,
    );
  },

  hideToast: () => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    toastTimeoutId = null;
    set({ toast: { visible: false, message: "", type: "info" } });
  },
}));



