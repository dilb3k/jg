import axios, { AxiosError, AxiosInstance } from "axios";
import NetInfo from "@react-native-community/netinfo";

import { API_BASE_URL } from "../constants";
import type {
  AuthUser,
  DailySnapshot,
  DatabaseStats,
  Debtor,
  InventoryEntry,
  InventorySummary,
  InventoryWithProduct,
  Product,
  AdminStatsResponse,
} from "../types";
import * as dbProducts from "../db/products";
import * as dbInventory from "../db/inventory";
import * as dbSnapshots from "../db/snapshots";
import * as dbSyncQueue from "../db/syncQueue";
import { getBusinessDate } from "../utils/businessDay";
import { getDeletedProductNameSync } from "../utils/deletedProductsCache";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type MongoDocument = {
  _id?: string;
};

type BackendInventoryItem = {
  [key: string]: unknown;
  productId: string;
  startQuantity: number;
  currentQuantity: number;
  sold?: number;
  revenue?: number;
  realizedProfit?: number;
  remaining?: number;
  stockSellValue?: number;
  stockBuyValue?: number;
  potentialProfit?: number;
  marginPercent?: number;
  note?: string;
  localId?: string;
  deviceId?: string;
  date?: string;
  name?: string;
  buyPrice?: number;
  sellPrice?: number;
  image?: string;
  product?: Record<string, unknown>;
  updatedAt?: string;
  createdAt?: string;
};

type BackendInventoryResponse = {
  items: BackendInventoryItem[];
  summary: {
    totalStart: number;
    totalCurrent: number;
    totalSold: number;
    totalRevenue: number;
    totalProfit: number;
    totalStockSellValue: number;
    totalStockBuyValue: number;
    totalStockProfit: number;
  };
};

type StartDayInventoryItem = {
  productId: string;
  startQuantity: number;
  currentQuantity?: number;
  note?: string;
  localId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type BulkCurrentInventoryItem = {
  productId: string;
  currentQuantity: number;
  note?: string;
};

let isOnline = false;
let connectionMode: "online" | "offline" = "online";
let moduleConnectionModeChangeHandler: ((mode: "online" | "offline") => void) | null = null;

NetInfo.addEventListener((state) => {
  const connected = state.isConnected ?? false;
  isOnline = connected;
});

export const setConnectionMode = (mode: "online" | "offline") => {
  connectionMode = mode;
};

export const getConnectionMode = (): "online" | "offline" => {
  return connectionMode;
};

export const getIsOnline = (): boolean => {
  return isOnline;
};

export const canReachServer = (): boolean => {
  return isOnline && connectionMode === "online";
};

const backendItemToEntry = (
  item: BackendInventoryItem,
  date: string,
  deviceId: string,
): InventoryEntry => ({
  localId: item.localId || `${date}-${item.productId}`,
  deviceId: item.deviceId || deviceId,
  productId: item.productId,
  date: item.date || date,
  startQuantity: item.startQuantity,
  currentQuantity: item.currentQuantity,
  sold: item.sold,
  revenue: item.revenue,
  realizedProfit: item.realizedProfit,
  note: item.note || "",
  updatedAt: item.updatedAt || new Date().toISOString(),
  createdAt: item.createdAt || new Date().toISOString(),
});

const parseBackendInventory = (
  data: unknown,
  date: string,
  deviceId: string,
): { entries: InventoryEntry[]; items: BackendInventoryItem[]; summary?: BackendInventoryResponse["summary"] } => {
  if (!data || typeof data !== "object") {
    return { entries: [], items: [] };
  }

  let rawItems: BackendInventoryItem[] = [];
  let summary: BackendInventoryResponse["summary"] | undefined;

  const extract = (source: any) => {
    if ("items" in source && Array.isArray(source.items)) {
      rawItems = source.items;
    }
    if ("summary" in source && source.summary) {
      summary = source.summary;
    }
  };

  if (Array.isArray(data)) {
    rawItems = data as BackendInventoryItem[];
  } else if ("data" in data && typeof (data as any).data === "object") {
    const inner = (data as any).data;
    if (Array.isArray(inner.items)) {
      rawItems = inner.items;
      if (inner.summary) summary = inner.summary;
    } else if (Array.isArray(inner)) {
      rawItems = inner;
    } else {
      extract(inner);
    }
  } else {
    extract(data);
  }

  const entries = rawItems.map((item) =>
    backendItemToEntry(item, date, deviceId),
  );

  return { entries, items: rawItems, summary };
};

const IMAGE_HASH_REGEX = /^[a-f0-9]{64}$/;

const resolveImageUrl = (image?: string): string | undefined => {
  if (!image) return undefined;
  if (image.startsWith("data:image/") || image.startsWith("https://") || image.startsWith("http://")) {
    return image;
  }
  if (IMAGE_HASH_REGEX.test(image)) {
    return `${API_BASE_URL}/products/image/${image}`;
  }
  return undefined;
};

const normalizeDocument = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeDocument(item)) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown> & MongoDocument;
  const normalized: Record<string, unknown> = {};

  Object.entries(record).forEach(([key, nestedValue]) => {
    if (key === "_id" && typeof nestedValue === "string" && !("id" in record)) {
      normalized.id = nestedValue;
      return;
    }

    normalized[key] = normalizeDocument(nestedValue);
  });

  return normalized as T;
};

const joinInventoryWithProducts = (
  inventory: InventoryEntry[],
  products: Product[],
): InventoryWithProduct[] => {
  const productsById = new Map(
    products.map((product) => [product.localId, product] as const),
  );

  return inventory.map((entry) => ({
    ...entry,
    product: productsById.get(entry.productId) ?? {
      localId: entry.productId,
      deviceId: entry.deviceId,
      entityType: "product",
      name: getDeletedProductNameSync(entry.productId) ?? "O'chirilgan mahsulot",
      quantity: entry.currentQuantity,
      buyPrice: 0,
      sellPrice: 0,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      isDeleted: true,
    },
  }));
};

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private unauthorizedHandler: (() => void) | null = null;
  private connectionModeChangeHandler: ((mode: "online" | "offline") => void) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
      maxContentLength: 10 * 1024 * 1024,
      maxBodyLength: 10 * 1024 * 1024,
    });

    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

     this.client.interceptors.response.use(
       (response) => response,
         (error: AxiosError<{ success?: boolean; error?: { message?: string; details?: unknown }; message?: string }>) => {
          if (error.response?.status === 401) {
            const data = error.response?.data;
            if (data && typeof data === "object") {
              if ("error" in data && data.error && typeof data.error === "object" && "message" in data.error && typeof data.error.message === "string") {
                this.unauthorizedHandler?.();
                return Promise.reject(new Error(data.error.message));
              }
              if ("message" in data && typeof data.message === "string") {
                this.unauthorizedHandler?.();
                return Promise.reject(new Error(data.message));
              }
            }
            this.unauthorizedHandler?.();
            return Promise.reject(new Error("Avtorizatsiya tugagan. Qayta kiring."));
          }
         if (error.code === "ECONNABORTED") {
           return Promise.reject(
             new Error("So'rov vaqti tugadi. Internet aloqasini tekshiring."),
           );
         }
          if (error.code === "ERR_NETWORK") {
            connectionMode = "offline";
            moduleConnectionModeChangeHandler?.("offline");
            return Promise.reject(
              new Error("Tarmoq xatoligi. Server bilan aloqa yo'q."),
            );
          }

         const data = error.response?.data;
         let message: string;
         if (data && typeof data === "object") {
           if ("error" in data && data.error && typeof data.error === "object" && "message" in data.error && typeof data.error.message === "string") {
             message = data.error.message;
           } else if ("message" in data && typeof data.message === "string") {
             message = data.message;
           } else {
             message = error.message || "API xatoligi";
           }
         } else {
           message = error.message || "API xatoligi";
         }

         return Promise.reject(new Error(message));
       },
     );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  setUnauthorizedHandler(handler: (() => void) | null) {
    this.unauthorizedHandler = handler;
  }

  setConnectionModeChangeHandler(handler: ((mode: "online" | "offline") => void) | null) {
    this.connectionModeChangeHandler = handler;
    moduleConnectionModeChangeHandler = handler;
  }

  private unwrap<T>(response: { data: ApiResponse<T> | T }): T {
    const payload = response.data as ApiResponse<T>;

    if (
      payload &&
      typeof payload === "object" &&
      "success" in payload &&
      "data" in payload
    ) {
      return normalizeDocument(payload.data);
    }

    return normalizeDocument(response.data as T);
  }

  async getProducts(search?: string): Promise<Product[]> {
    if (!canReachServer()) {
      if (search) {
        return dbProducts.searchProducts(search);
      }
      const products = await dbProducts.getAllProducts();
      return products;
    }

    try {
      const response = await this.client.get<ApiResponse<Product[]>>(
        "/products",
        { params: search ? { search } : undefined },
      );
      const products = this.unwrap(response);
      await dbProducts.saveProducts(products);
      return products.map((p: Product) => ({
        ...p,
        image: resolveImageUrl(p.image),
      }));
    } catch (err) {
      console.error("API getProducts failed, falling back to local:", err);
      const products = await dbProducts.getAllProducts();
      return products;
    }
  }

  async createProduct(product: Product): Promise<Product> {
    await dbProducts.createProduct(product);
    await dbInventory.syncTodayInventoryWithProducts();

    if (!canReachServer()) {
      await dbSyncQueue.addToSyncQueue({
        id: product.localId,
        entityType: "product",
        operation: "upsert",
        data: product,
        createdAt: new Date().toISOString(),
      });
      return product;
    }

    try {
      const response = await this.client.post<ApiResponse<Product>>("/products", {
        deviceId: product.deviceId,
        name: product.name,
        quantity: product.quantity,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        image: product.image,
        localId: product.localId,
        barcodes: product.barcodes,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
      const created = this.unwrap(response);
      return { ...created, image: resolveImageUrl(created.image) };
    } catch {
      await dbSyncQueue.addToSyncQueue({
        id: product.localId,
        entityType: "product",
        operation: "upsert",
        data: product,
        createdAt: new Date().toISOString(),
      });
      return product;
    }
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const existing = await dbProducts.getProductByLocalId(id);
    if (!existing) {
      return product as Product;
    }

    const sellPriceChanged = product.sellPrice !== undefined && product.sellPrice !== existing.sellPrice;
    const priceChanged = sellPriceChanged ||
      (product.buyPrice !== undefined && product.buyPrice !== existing.buyPrice);
    const quantityChanged = product.quantity !== undefined && product.quantity !== existing.quantity;

    if (sellPriceChanged) {
      const today = getBusinessDate();
      const allInv = await dbInventory.getAllInventoryEntries();
      const todayEntry = allInv.find((e) => e.productId === id && e.date === today);
      if (todayEntry) {
        const sold = (todayEntry.startQuantity ?? 0) - (todayEntry.currentQuantity ?? 0);
        if (sold > 0) {
          todayEntry.lockedRevenue = (todayEntry.lockedRevenue ?? 0) + sold * existing.sellPrice;
          todayEntry.lockedProfit = (todayEntry.lockedProfit ?? 0) + sold * (existing.sellPrice - existing.buyPrice);
          todayEntry.lockedSold = (todayEntry.lockedSold ?? 0) + sold;
          todayEntry.startQuantity = todayEntry.currentQuantity;
          todayEntry.updatedAt = new Date().toISOString();
          await dbInventory.saveInventoryEntries([todayEntry]);
        }
      }
    }

    const updated = { ...existing, ...product, updatedAt: new Date().toISOString() };
    await dbProducts.updateProduct(updated);

    if (priceChanged || quantityChanged) {
      await dbInventory.syncTodayInventoryWithProducts();

      if (quantityChanged) {
        const qty = product.quantity!;
        const today = getBusinessDate();
        const allInv = await dbInventory.getAllInventoryEntries();
        const todayEntry = allInv.find((e) => e.productId === id && e.date === today);
        if (todayEntry) {
          const delta = qty - existing.quantity;
          todayEntry.startQuantity = (todayEntry.startQuantity ?? 0) + delta;
          todayEntry.currentQuantity = (todayEntry.currentQuantity ?? 0) + delta;
          todayEntry.updatedAt = new Date().toISOString();
          await dbInventory.saveInventoryEntries([todayEntry]);
        }
      }

      if (priceChanged) {
        await dbInventory.syncTodayInventoryWithProducts();
      }
    }

    if (!canReachServer()) {
      await dbSyncQueue.addToSyncQueue({
        id,
        entityType: "product",
        operation: "upsert",
        data: updated,
        createdAt: new Date().toISOString(),
      });
      return updated;
    }

    try {
      const payload = { ...updated };
      if (payload.displayIndex !== undefined && payload.displayIndex < 1) {
        delete payload.displayIndex;
      }

      const response = await this.client.put<ApiResponse<Product>>(
        `/products/${id}`,
        payload,
      );
      const apiUpdated = this.unwrap(response);
      return { ...apiUpdated, image: resolveImageUrl(apiUpdated.image) };
    } catch {
      await dbSyncQueue.addToSyncQueue({
        id,
        entityType: "product",
        operation: "upsert",
        data: updated,
        createdAt: new Date().toISOString(),
      });
      return updated;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    await dbProducts.deleteProductByLocalId(id);

    if (!canReachServer()) {
      await dbSyncQueue.addToSyncQueue({
        id,
        entityType: "product",
        operation: "delete",
        data: { localId: id },
        createdAt: new Date().toISOString(),
      });
      return;
    }

    try {
      await this.client.delete(`/products/${id}`);
    } catch {
      await dbSyncQueue.addToSyncQueue({
        id,
        entityType: "product",
        operation: "delete",
        data: { localId: id },
        createdAt: new Date().toISOString(),
      });
    }
  }

  async getInventoryWithProducts(
    dateOrOptions?: string | { date?: string; from?: string; to?: string; products?: Product[] },
    productsArg?: Product[],
  ): Promise<{ items: InventoryWithProduct[]; summary?: InventorySummary }> {
    let date: string | undefined;
    let from: string | undefined;
    let to: string | undefined;
    let products: Product[] | undefined = productsArg;

    if (typeof dateOrOptions === "object") {
      date = dateOrOptions.date;
      from = dateOrOptions.from;
      to = dateOrOptions.to;
      products = dateOrOptions.products ?? productsArg;
    } else {
      date = dateOrOptions;
    }

    const effectiveDate = date || from || "";

    if (!canReachServer()) {
      if (date) {
        const derived = await dbInventory.getInventoryWithProduct(date);
        return { items: derived };
      }

      const localProducts = products ?? await dbProducts.getAllProducts();
      const allEntries = await dbInventory.getAllInventoryEntries();
      const localInventory = from || to
        ? allEntries.filter((e) => (!from || e.date >= from) && (!to || e.date <= to))
        : allEntries;

      const productsById = new Map(localProducts.map((p) => [p.localId, p]));
      const joined = localInventory.map((entry) => {
        const product = productsById.get(entry.productId);
        return {
          ...entry,
          buyPrice: product?.buyPrice ?? entry.buyPrice ?? 0,
          sellPrice: product?.sellPrice ?? entry.sellPrice ?? 0,
          product: product ?? {
            localId: entry.productId,
            deviceId: entry.deviceId,
            entityType: "product" as const,
            name: getDeletedProductNameSync(entry.productId) ?? "O'chirilgan mahsulot",
            quantity: entry.currentQuantity,
            buyPrice: 0,
            sellPrice: 0,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            isDeleted: true,
          },
        };
      });
      return { items: joined };
    }

    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (date && !from && !to) {
        params.from = date;
        params.to = date;
      }

      const response = await this.client.get<ApiResponse<BackendInventoryResponse>>("/inventory", {
        params,
      });

      const data = this.unwrap(response);
      const rawItems = (data as any)?.items ?? [];
      const summary = (data as any)?.summary;

      if (rawItems.length > 0) {
        const entries: InventoryEntry[] = rawItems.map((item: any) => ({
          localId: item.localId || `${effectiveDate}-${item.productId}`,
          deviceId: item.deviceId || "",
          productId: item.productId,
          date: item.date || effectiveDate,
          startQuantity: item.startQuantity,
          currentQuantity: item.currentQuantity,
          sold: item.sold,
          revenue: item.revenue,
          realizedProfit: item.realizedProfit,
          note: item.note || "",
          updatedAt: item.updatedAt || new Date().toISOString(),
          createdAt: item.createdAt || new Date().toISOString(),
        }));
        await dbInventory.saveInventoryEntries(entries);
      }

      if (summary) {
        await dbInventory.saveInventorySummary(summary);
      }

      const resolveProductImage = (p: any) => ({
        ...p,
        image: resolveImageUrl(p.image),
      });

      const joinedItems: InventoryWithProduct[] = rawItems.map((item: any) => ({
        localId: item.localId || `${effectiveDate}-${item.productId}`,
        deviceId: item.deviceId || "",
        productId: item.productId,
        date: item.date || effectiveDate,
        startQuantity: item.startQuantity,
        currentQuantity: item.currentQuantity,
        sold: item.sold,
        revenue: item.revenue,
        realizedProfit: item.realizedProfit,
        note: item.note || "",
        remaining: item.remaining,
        stockSellValue: item.stockSellValue,
        stockBuyValue: item.stockBuyValue,
        potentialProfit: item.potentialProfit,
        marginPercent: item.marginPercent,
        updatedAt: item.updatedAt || new Date().toISOString(),
        createdAt: item.createdAt || new Date().toISOString(),
        product: item.product
          ? resolveProductImage(item.product)
          : resolveProductImage({
              localId: item.productId,
              deviceId: item.deviceId || "",
              entityType: "product" as const,
              name: getDeletedProductNameSync(item.productId) ?? "O'chirilgan mahsulot",
              quantity: item.currentQuantity,
              buyPrice: item.buyPrice || 0,
              sellPrice: item.sellPrice || 0,
              image: item.image || "",
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString(),
              isDeleted: true,
            }),
      }));

      return { items: joinedItems, summary: summary as InventorySummary | undefined };
    } catch (error: any) {
      console.error("getInventoryWithProducts error:", error.message);

      if (date) {
        const derived = await dbInventory.getInventoryWithProduct(date);
        return { items: derived };
      }

      const [inventoryResult, resolvedProducts] = await Promise.all([
        (async () => {
          if (!canReachServer()) {
            const result = date ? await dbInventory.getInventoryByDate(date) : [];
            return { entries: result };
          }
          try {
            const params: Record<string, string> = {};
            if (from) params.from = from;
            if (to) params.to = to;
            if (date && !from && !to) {
              params.from = date;
              params.to = date;
            }
            const invResponse = await this.client.get<ApiResponse<BackendInventoryResponse>>("/inventory", { params });
            const invData = this.unwrap(invResponse);
            const effectiveDate = date || from || "";
            const { entries, summary } = parseBackendInventory(invData, effectiveDate, "");
            if (entries.length > 0) {
              await dbInventory.saveInventoryEntries(entries);
            }
            return { entries, summary: summary as InventorySummary | undefined };
          } catch (err) {
            console.error("API getInventory failed, falling back to local:", err);
            const result = date ? await dbInventory.getInventoryByDate(date) : [];
            return { entries: result };
          }
        })(),
        products ? Promise.resolve(products) : this.getProducts(),
      ]);

      return { items: joinInventoryWithProducts(inventoryResult.entries, resolvedProducts), summary: inventoryResult.summary };
    }
  }

  async startDayInventory(
    deviceId: string,
    items: StartDayInventoryItem[],
    date?: string,
  ): Promise<void> {
    const inventoryDate = date || getBusinessDate();

    for (const item of items) {
      const entry: InventoryEntry = {
        id: undefined,
        localId: item.localId || `${inventoryDate}-${item.productId}`,
        deviceId,
        productId: item.productId,
        date: inventoryDate,
        startQuantity: item.startQuantity,
        currentQuantity: item.currentQuantity ?? item.startQuantity,
        note: item.note || "",
        updatedAt: new Date().toISOString(),
        createdAt: item.createdAt || new Date().toISOString(),
      };
      await dbInventory.updateInventoryEntry(entry);
    }

    if (!canReachServer()) {
      await dbSyncQueue.addToSyncQueue({
        id: `start-day-${inventoryDate}`,
        entityType: "inventory",
        operation: "upsert",
        data: { deviceId, items, date: inventoryDate },
        createdAt: new Date().toISOString(),
      });
      return;
    }

    try {
      await this.client.post("/inventory/start-day", {
        deviceId,
        date: inventoryDate,
        items,
      });
    } catch {
      await dbSyncQueue.addToSyncQueue({
        id: `start-day-${inventoryDate}`,
        entityType: "inventory",
        operation: "upsert",
        data: { deviceId, items, date: inventoryDate },
        createdAt: new Date().toISOString(),
      });
    }
  }

  async bulkUpdateInventory(
    deviceId: string,
    items: BulkCurrentInventoryItem[],
    date?: string,
  ): Promise<void> {
    const inventoryDate = date || getBusinessDate();

    for (const item of items) {
      const existing = (await dbInventory.getInventoryByDate(inventoryDate)).find(
        (e) => e.productId === item.productId,
      );
      if (existing) {
        const updated: InventoryEntry = {
          ...existing,
          currentQuantity: item.currentQuantity,
          note: item.note || existing.note,
          updatedAt: new Date().toISOString(),
        };
        await dbInventory.updateInventoryEntry(updated);
      }
    }

    if (!canReachServer()) {
      await dbSyncQueue.addToSyncQueue({
        id: `bulk-update-${inventoryDate}`,
        entityType: "inventory",
        operation: "upsert",
        data: { deviceId, items, date: inventoryDate },
        createdAt: new Date().toISOString(),
      });
      return;
    }

    try {
      await this.client.put("/inventory/bulk-current", {
        deviceId,
        date: inventoryDate,
        items,
      });
    } catch {
      await dbSyncQueue.addToSyncQueue({
        id: `bulk-update-${inventoryDate}`,
        entityType: "inventory",
        operation: "upsert",
        data: { deviceId, items, date: inventoryDate },
        createdAt: new Date().toISOString(),
      });
    }
  }

  async getSnapshotsRange(from: string, to: string): Promise<DailySnapshot[]> {
    if (!canReachServer()) {
      return dbSnapshots.getSnapshotsRange(from, to);
    }

    try {
      const response = await this.client.get<ApiResponse<DailySnapshot[]>>(
        "/snapshots/range",
        { params: { from, to } },
      );
      const snapshots = this.unwrap(response);
      await dbSnapshots.saveSnapshots(snapshots);
      return snapshots;
    } catch (err) {
      console.error("API getSnapshotsRange failed, falling back to local:", err);
      return dbSnapshots.getSnapshotsRange(from, to);
    }
  }

  async sync(data: {
    products?: Product[];
    inventory?: InventoryEntry[];
    lastSyncAt?: string;
  }): Promise<{
    products: Product[];
    inventory: InventoryEntry[];
    serverTime: string;
  }> {
    if (!canReachServer()) {
      throw new Error("Serverga ulanib bo'lmadi. Oflayn rejimda sync ishlamaydi.");
    }

    const sanitizedProducts = (data.products ?? []).map((p) => {
      if (p.displayIndex !== undefined && p.displayIndex < 1) {
        const { displayIndex: _, ...rest } = p;
        return rest;
      }
      return p;
    });

    const response = await this.client.post<
      ApiResponse<{
        products: Product[];
        inventory: InventoryEntry[];
        serverTime: string;
      }>
    >("/sync", { ...data, products: sanitizedProducts });

    const result = this.unwrap(response) as {
      products: Product[];
      inventory: InventoryEntry[];
      serverTime: string;
    };

    const [localProducts, localInventory] = await Promise.all([
      dbProducts.getAllProducts(),
      dbInventory.getAllInventoryEntries(),
    ]);

    const serverProductMap = new Map(
      (result.products || []).map((p) => [p.localId, p]),
    );
    const serverInventoryMap = new Map(
      (result.inventory || []).map((i) => [i.localId, i]),
    );

    const mergedProducts = localProducts.map((p) =>
      serverProductMap.has(p.localId) ? serverProductMap.get(p.localId)! : p,
    );
    const newServerProducts = (result.products || []).filter(
      (p) => !localProducts.some((lp) => lp.localId === p.localId),
    );
    mergedProducts.push(...newServerProducts);

    const mergedInventory = localInventory.map((i) =>
      serverInventoryMap.has(i.localId) ? serverInventoryMap.get(i.localId)! : i,
    );
    const newServerInventory = (result.inventory || []).filter(
      (i) => !localInventory.some((li) => li.localId === i.localId),
    );
    mergedInventory.push(...newServerInventory);

    await Promise.all([
      dbProducts.saveProducts(mergedProducts),
      dbInventory.saveInventoryEntries(mergedInventory),
    ]);

    const resolvedProducts = mergedProducts.map((p) => ({
      ...p,
      image: resolveImageUrl(p.image),
    }));

    return { ...result, products: resolvedProducts };
  }

  async processSyncQueue(): Promise<void> {
    const queue = await dbSyncQueue.getSyncQueue();
    if (queue.length === 0 || !canReachServer()) return;

    const upsertItems = queue.filter((item) => item.operation === "upsert");
    const deleteItems = queue.filter((item) => item.operation === "delete");

    const upsertResults = await Promise.allSettled(
      upsertItems.map(async (item) => {
        if (item.entityType === "product") {
          const data = { ...(item.data as Product) };
          if (data.displayIndex !== undefined && data.displayIndex < 1) {
            delete data.displayIndex;
          }
          await this.client.put(`/products/${item.id}`, data);
        } else if (item.entityType === "inventory") {
          const data = item.data as { deviceId: string; items: StartDayInventoryItem[] | BulkCurrentInventoryItem[]; date: string };
          if (data.items?.length > 0) {
            if (item.id.startsWith("bulk-update-")) {
              await this.client.put("/inventory/bulk-current", data);
            } else {
              await this.client.post("/inventory/start-day", data);
            }
          }
        } else if (item.entityType === "snapshot") {
          const data = item.data as DailySnapshot;
          await this.client.post("/snapshots/daily", data);
        }
      })
    );

    const deleteResults = await Promise.allSettled(
      deleteItems.map(async (item) => {
        if (item.entityType === "product") {
          await this.client.delete(`/products/${item.id}`);
        } else if (item.entityType === "inventory") {
          await this.client.delete(`/inventory/entry/${item.id}`);
        } else if (item.entityType === "snapshot") {
          await this.client.delete(`/snapshots/daily/${item.id}`);
        }
      })
    );

    const syncedIds: string[] = [];
    const allItems = [...upsertItems, ...deleteItems];
    const allResults = [...upsertResults, ...deleteResults];

    allResults.forEach((result, index) => {
      if (result.status === "fulfilled" && index < allItems.length) {
        syncedIds.push(allItems[index].id);
      }
    });

    if (syncedIds.length > 0) {
      await dbSyncQueue.clearSyncQueue(syncedIds);
    }
  }

  async register(
    username: string,
    password: string,
    phone_number?: string,
    businessDayStartHour?: number,
  ): Promise<{ token: string; user: AuthUser }> {
    const response = await this.client.post<
      ApiResponse<{ token: string; user: AuthUser }>
    >("/auth/register", { username, password, phone_number, businessDayStartHour });
    return this.unwrap(response);
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ token: string; user: AuthUser }> {
    const response = await this.client.post<
      ApiResponse<{ token: string; user: AuthUser }>
    >("/auth/login", { username, password });
    return this.unwrap(response);
  }

  async getMe(): Promise<AuthUser> {
    if (!canReachServer()) {
      throw new Error("Internet aloqasi yo'q. Oflayn rejim.");
    }
    const response = await this.client.get<ApiResponse<AuthUser>>("/auth/me");
    return this.unwrap(response);
  }

  async updateMe(payload: { username?: string; phone_number?: string; businessDayStartHour?: number; blockCode?: string | null }): Promise<{ user: AuthUser; token: string }> {
    const response = await this.client.put<ApiResponse<{ user: AuthUser; token: string }>>("/auth/me", payload);
    return this.unwrap(response);
  }

  async getAdmins(): Promise<AuthUser[]> {
    if (!canReachServer()) {
      throw new Error("Adminlar ro'yxatini yuklash uchun server kerak");
    }
    const response =
      await this.client.get<ApiResponse<AuthUser[]>>("/auth/admins");
    return this.unwrap(response);
  }

  async createAdmin(username: string, password: string, tier?: "tekin" | "bor" | "pro", phone_number?: string, durationMonths?: number): Promise<AuthUser> {
    if (!canReachServer()) {
      throw new Error("Admin yaratish uchun server kerak");
    }
    const payload: Record<string, any> = { username, password };
    if (phone_number !== undefined) {
      payload.phone_number = phone_number;
    }
    if (tier !== undefined) {
      payload.tier = tier;
    }
    if (durationMonths !== undefined) {
      payload.durationMonths = durationMonths;
    }
    const response = await this.client.post<ApiResponse<AuthUser>>(
      "/auth/admins",
      payload,
    );
    return this.unwrap(response);
  }

  async bulkUpdateUsersTier(tier: "tekin" | "bor" | "pro"): Promise<void> {
    if (!canReachServer()) {
      throw new Error("Server kerak");
    }
    const response = await this.client.put<ApiResponse<void>>(
      `/auth/users/tier`,
      { tier },
    );
    return this.unwrap(response);
  }

  async updateAdmin(id: string, data: { username?: string; phone_number?: string; password?: string; tier?: "tekin" | "bor" | "pro"; durationMonths?: number }): Promise<AuthUser> {
    if (!canReachServer()) {
      throw new Error("Admin tahrirlash uchun server kerak");
    }
    const response = await this.client.put<ApiResponse<AuthUser>>(
      `/auth/admins/${id}`,
      data,
    );
    return this.unwrap(response);
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    if (!canReachServer()) {
      throw new Error("Statistika yuklash uchun server kerak");
    }
    const response = await this.client.get<ApiResponse<DatabaseStats>>(
      "/stats",
    );
    return this.unwrap(response);
  }

  async getAdminStats(): Promise<AdminStatsResponse> {
    if (!canReachServer()) {
      throw new Error("Admin statistikasini yuklash uchun server kerak");
    }
    const response = await this.client.get<ApiResponse<AdminStatsResponse>>(
      "/auth/admins/stats",
    );
    return this.unwrap(response);
  }

  async deleteAdmin(id: string): Promise<void> {
    if (!canReachServer()) {
      throw new Error("Admin o'chirish uchun server kerak");
    }
    await this.client.delete(`/auth/admins/${id}`);
  }

  // Debtors
  async getDebtors(): Promise<Debtor[]> {
    if (!canReachServer()) {
      throw new Error("Qarzdorlar ro'yxatini yuklash uchun server kerak");
    }
    const response = await this.client.get<ApiResponse<Debtor[]>>("/debtors");
    return this.unwrap(response);
  }

  async getDebtor(id: string): Promise<Debtor> {
    if (!canReachServer()) {
      throw new Error("Qarzdorni yuklash uchun server kerak");
    }
    const response = await this.client.get<ApiResponse<Debtor>>(`/debtors/${id}`);
    return this.unwrap(response);
  }

  async createDebtor(data: {
    name: string;
    amount: number;
    phone?: string;
    notes?: string;
  }): Promise<Debtor> {
    if (!canReachServer()) {
      throw new Error("Qarzdor yaratish uchun server kerak");
    }
    const response = await this.client.post<ApiResponse<Debtor>>("/debtors", data);
    return this.unwrap(response);
  }

  async updateDebtor(id: string, data: { name?: string; phone?: string; notes?: string }): Promise<Debtor> {
    if (!canReachServer()) {
      throw new Error("Qarzdorni tahrirlash uchun server kerak");
    }
    const response = await this.client.put<ApiResponse<Debtor>>(`/debtors/${id}`, data);
    return this.unwrap(response);
  }

  async adjustDebt(
    id: string,
    data: { amount: number; type: "add" | "subtract"; note?: string }
  ): Promise<Debtor> {
    if (!canReachServer()) {
      throw new Error("Qarzni o'zgartirish uchun server kerak");
    }
    const response = await this.client.post<ApiResponse<Debtor>>(`/debtors/${id}/adjust`, data);
    return this.unwrap(response);
  }

  async deleteDebtor(id: string): Promise<void> {
    if (!canReachServer()) {
      throw new Error("Qarzdorni o'chirish uchun server kerak");
    }
    await this.client.delete(`/debtors/${id}`);
  }

  async applySales(date: string, deviceId: string, lines: { productId: string; quantity: number }[]): Promise<{
    items: InventoryWithProduct[];
    snapshot: DailySnapshot | null;
  }> {
    if (!canReachServer()) {
      throw new Error("Savdoni amalga oshirish uchun server kerak");
    }
    const response = await this.client.post<ApiResponse<{
      items: InventoryWithProduct[];
      snapshot: DailySnapshot | null;
    }>>("/inventory/sales", { date, deviceId, lines });
    const data = this.unwrap(response);
    return {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        product: item.product
          ? { ...item.product, image: resolveImageUrl(item.product.image) }
              : {
                  localId: item.productId,
                  deviceId: item.deviceId || "",
                  entityType: "product" as const,
                  name: getDeletedProductNameSync(item.productId) ?? "O'chirilgan mahsulot",
                  quantity: item.currentQuantity,
                  buyPrice: 0,
                  sellPrice: 0,
                  createdAt: item.createdAt,
                  updatedAt: item.updatedAt,
                  isDeleted: true,
                },
          })),
    };
  }

  async getDashboard(): Promise<{
    products: Product[];
    inventory: InventoryWithProduct[];
    inventorySummary?: InventorySummary;
    snapshot: DailySnapshot | null;
  }> {
    if (!canReachServer()) {
      throw new Error("Dashboard ma'lumotlarini yuklash uchun server kerak");
    }
    const response = await this.client.get<ApiResponse<{
      products: Product[];
      inventory: InventoryWithProduct[];
      inventorySummary?: InventorySummary;
      snapshot: DailySnapshot | null;
    }>>("/inventory/dashboard");
    const data = this.unwrap(response);
    return {
      ...data,
      products: data.products.map((p: Product) => ({
        ...p,
        image: resolveImageUrl(p.image),
      })),
      inventory: data.inventory.map((item) => ({
        ...item,
        product: item.product
          ? { ...item.product, image: resolveImageUrl(item.product.image) }
          : {
              localId: item.productId,
              deviceId: item.deviceId || "",
              entityType: "product" as const,
              name: getDeletedProductNameSync(item.productId) ?? "O'chirilgan mahsulot",
              quantity: item.currentQuantity,
              buyPrice: 0,
              sellPrice: 0,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              isDeleted: true,
            },
      })),
    };
  }
}

export const apiClient = new ApiClient();


