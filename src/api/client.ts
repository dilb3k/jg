import axios, { AxiosError, AxiosInstance } from "axios";
import NetInfo from "@react-native-community/netinfo";

import { API_BASE_URL } from "../constants";
import type {
  AuthUser,
  DailySnapshot,
  InventoryEntry,
  InventorySummary,
  InventoryWithProduct,
  Product,
} from "../types";
import * as dbProducts from "../db/products";
import * as dbInventory from "../db/inventory";
import * as dbSnapshots from "../db/snapshots";
import * as dbSyncQueue from "../db/syncQueue";
import { getBusinessDate } from "../utils/businessDay";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type MongoDocument = {
  _id?: string;
};

type BackendInventoryItem = {
  productId: string;
  startQuantity: number;
  currentQuantity: number;
  sold?: number;
  revenue?: number;
  realizedProfit?: number;
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
let wasAutoSetOffline = false;
let moduleConnectionModeChangeHandler: ((mode: "online" | "offline") => void) | null = null;

NetInfo.addEventListener((state) => {
  const connected = state.isConnected ?? false;
  isOnline = connected;

  if (connected && wasAutoSetOffline) {
    wasAutoSetOffline = false;
    connectionMode = "online";
    moduleConnectionModeChangeHandler?.("online");
  }
});

export const setConnectionMode = (mode: "online" | "offline") => {
  connectionMode = mode;
  wasAutoSetOffline = false;
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
  localId: `${date}-${item.productId}`,
  deviceId,
  productId: item.productId,
  date,
  startQuantity: item.startQuantity,
  currentQuantity: item.currentQuantity,
  sold: item.sold,
  revenue: item.revenue,
  realizedProfit: item.realizedProfit,
  note: "",
  isDeleted: false,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
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
      name: "Noma'lum mahsulot",
      quantity: entry.currentQuantity,
      buyPrice: 0,
      sellPrice: 0,
      isDeleted: false,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
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
      (error: AxiosError<{ message?: string }>) => {
        if (error.response?.status === 401) {
          this.unauthorizedHandler?.();
          return Promise.reject(new Error("Avtorizatsiya tugagan. Qayta kiring."));
        }
        if (error.code === "ECONNABORTED") {
          return Promise.reject(
            new Error("So'rov vaqti tugadi. Internet aloqasini tekshiring."),
          );
        }
        if (error.code === "ERR_NETWORK") {
          wasAutoSetOffline = true;
          setConnectionMode("offline");
          this.connectionModeChangeHandler?.("offline");
          return Promise.reject(
            new Error("Tarmoq xatoligi. Server bilan aloqa yo'q."),
          );
        }
        const message =
          error.response?.data?.message || error.message || "API xatoligi";
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
      return products.filter((p) => !p.isDeleted);
    }

    try {
      const response = await this.client.get<ApiResponse<Product[]>>(
        "/products",
        { params: search ? { search } : undefined },
      );
      const products = this.unwrap(response);
      await dbProducts.saveProducts(products);
      return products.filter((p) => !p.isDeleted);
    } catch (error) {
      console.error("API getProducts failed, falling back to local:", error);
      const products = await dbProducts.getAllProducts();
      return products.filter((p) => !p.isDeleted);
    }
  }

  async getProduct(id: string): Promise<Product> {
    if (!canReachServer()) {
      const product = await dbProducts.getProductByLocalId(id);
      if (product) return product;
      throw new Error("Mahsulot topilmadi (oflayn rejim)");
    }

    try {
      const response = await this.client.get<ApiResponse<Product>>(
        `/products/${id}`,
      );
      return this.unwrap(response);
    } catch (error) {
      const product = await dbProducts.getProductByLocalId(id);
      if (product) return product;
      throw error;
    }
  }

  async createProduct(product: Product): Promise<Product> {
    await dbProducts.createProduct(product);

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
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
      return this.unwrap(response);
    } catch (error) {
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
    if (existing) {
      const updated = { ...existing, ...product, updatedAt: new Date().toISOString() };
      await dbProducts.updateProduct(updated);
    }

    if (!canReachServer()) {
      await dbSyncQueue.addToSyncQueue({
        id,
        entityType: "product",
        operation: "upsert",
        data: product,
        createdAt: new Date().toISOString(),
      });
      return { ...existing, ...product } as Product;
    }

    try {
      const response = await this.client.put<ApiResponse<Product>>(
        `/products/${id}`,
        {
          deviceId: product.deviceId,
          name: product.name,
          quantity: product.quantity,
          buyPrice: product.buyPrice,
          sellPrice: product.sellPrice,
          image: product.image,
          localId: product.localId,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      );
      return this.unwrap(response);
    } catch (error) {
      await dbSyncQueue.addToSyncQueue({
        id,
        entityType: "product",
        operation: "upsert",
        data: product,
        createdAt: new Date().toISOString(),
      });
      return { ...existing, ...product } as Product;
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
    } catch (error) {
      await dbSyncQueue.addToSyncQueue({
        id,
        entityType: "product",
        operation: "delete",
        data: { localId: id },
        createdAt: new Date().toISOString(),
      });
    }
  }

  async getInventory(date?: string, from?: string, to?: string): Promise<{ entries: InventoryEntry[]; summary?: InventorySummary }> {
    if (!canReachServer()) {
      const result = date ? await dbInventory.getInventoryByDate(date) : [];
      return { entries: result };
    }

    try {
      const params: Record<string, string> = {};
      if (date) params.date = date;
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await this.client.get<ApiResponse<BackendInventoryResponse>>(
        "/inventory",
        { params },
      );
      const data = this.unwrap(response);
      const { entries, summary } = parseBackendInventory(data, date || from || "", "");
      if (entries.length > 0) {
        await dbInventory.saveInventoryEntries(entries);
      }
      return { entries, summary: summary as InventorySummary | undefined };
    } catch (error) {
      console.error("API getInventory failed, falling back to local:", error);
      const result = date ? await dbInventory.getInventoryByDate(date) : [];
      return { entries: result };
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
      const localProducts = products ?? await dbProducts.getAllProducts();
      const allEntries = await dbInventory.getAllInventoryEntries();
      const localInventory = date
        ? allEntries.filter((e) => e.date === date)
        : from || to
          ? allEntries.filter((e) => (!from || e.date >= from) && (!to || e.date <= to))
          : allEntries;

      const productsById = new Map(localProducts.map((p) => [p.localId, p]));
      const joined = localInventory.map((entry) => ({
        ...entry,
        product: productsById.get(entry.productId) ?? {
          localId: entry.productId,
          deviceId: entry.deviceId,
          entityType: "product" as const,
          name: "Noma'lum mahsulot",
          quantity: entry.currentQuantity,
          buyPrice: 0,
          sellPrice: 0,
          isDeleted: false,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        },
      }));
      return { items: joined };
    }

    try {
      const params: Record<string, string> = {};
      if (date) params.date = date;
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await this.client.get<ApiResponse<BackendInventoryResponse>>("/inventory", {
        params,
      });

      const data = this.unwrap(response);
      const { entries, items, summary } = parseBackendInventory(data, effectiveDate, "");

      if (entries.length > 0) {
        await dbInventory.saveInventoryEntries(entries);
      }

      if (summary) {
        await dbInventory.saveInventorySummary(summary);
      }

      const resolvedProducts = products ?? await this.getProducts();

      if (items.length > 0) {
        const joinedItems = items.map((item) => {
          const product = resolvedProducts.find((p) => p.localId === item.productId);
          return {
            localId: `${effectiveDate}-${item.productId}`,
            deviceId: product?.deviceId || "",
            productId: item.productId,
            date: effectiveDate,
            startQuantity: item.startQuantity,
            currentQuantity: item.currentQuantity,
            sold: item.sold,
            revenue: item.revenue,
            realizedProfit: item.realizedProfit,
            note: "",
            isDeleted: false,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            product: product ?? {
              localId: item.productId,
              deviceId: "",
              entityType: "product" as const,
              name: "Noma'lum mahsulot",
              quantity: item.currentQuantity,
              buyPrice: 0,
              sellPrice: 0,
              isDeleted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
        });
        return { items: joinedItems, summary: summary as InventorySummary | undefined };
      }

      return { items: joinInventoryWithProducts(entries, resolvedProducts), summary: summary as InventorySummary | undefined };
    } catch (error: any) {
      console.error("getInventoryWithProducts error:", error.message);

      const [inventoryResult, resolvedProducts] = await Promise.all([
        this.getInventory(date, from, to),
        products ? Promise.resolve(products) : this.getProducts(),
      ]);

      return { items: joinInventoryWithProducts(inventoryResult.entries, resolvedProducts), summary: inventoryResult.summary };
    }
  }

  async getInventoryRange(from: string, to: string): Promise<InventoryEntry[]> {
    if (!canReachServer()) {
      return dbInventory.getInventoryRange(from, to);
    }

    try {
      const response = await this.client.get<ApiResponse<InventoryEntry[]>>(
        "/inventory/range",
        { params: { from, to } },
      );
      const entries = this.unwrap(response);
      await dbInventory.saveInventoryEntries(entries);
      return entries;
    } catch (error) {
      console.error("API getInventoryRange failed, falling back to local:", error);
      return dbInventory.getInventoryRange(from, to);
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
        isDeleted: false,
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
    } catch (error) {
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
    } catch (error) {
      await dbSyncQueue.addToSyncQueue({
        id: `bulk-update-${inventoryDate}`,
        entityType: "inventory",
        operation: "upsert",
        data: { deviceId, items, date: inventoryDate },
        createdAt: new Date().toISOString(),
      });
    }
  }

  async getDailySnapshot(date: string): Promise<DailySnapshot> {
    if (!canReachServer()) {
      const snapshot = await dbSnapshots.getSnapshotByDate(date);
      if (snapshot) return snapshot;
      throw new Error("Snapshot topilmadi (oflayn rejim)");
    }

    try {
      const response = await this.client.get<ApiResponse<DailySnapshot>>(
        "/snapshots/daily",
        { params: { date } },
      );
      const snapshot = this.unwrap(response);
      await dbSnapshots.updateSnapshot(snapshot);
      return snapshot;
    } catch (error) {
      const snapshot = await dbSnapshots.getSnapshotByDate(date);
      if (snapshot) return snapshot;
      throw error;
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
    } catch (error) {
      console.error("API getSnapshotsRange failed, falling back to local:", error);
      return dbSnapshots.getSnapshotsRange(from, to);
    }
  }

  async createDailySnapshot(snapshot: DailySnapshot): Promise<DailySnapshot> {
    await dbSnapshots.updateSnapshot(snapshot);

    if (!canReachServer()) {
      await dbSyncQueue.addToSyncQueue({
        id: snapshot.localId,
        entityType: "snapshot",
        operation: "upsert",
        data: snapshot,
        createdAt: new Date().toISOString(),
      });
      return snapshot;
    }

    try {
      const response = await this.client.post<ApiResponse<DailySnapshot>>(
        "/snapshots/daily",
        snapshot,
      );
      return this.unwrap(response);
    } catch (error) {
      await dbSyncQueue.addToSyncQueue({
        id: snapshot.localId,
        entityType: "snapshot",
        operation: "upsert",
        data: snapshot,
        createdAt: new Date().toISOString(),
      });
      return snapshot;
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

    const response = await this.client.post<
      ApiResponse<{
        products: Product[];
        inventory: InventoryEntry[];
        serverTime: string;
      }>
    >("/sync", data);

    const result = this.unwrap(response);

    await Promise.all([
      dbProducts.saveProducts(result.products),
      dbInventory.saveInventoryEntries(result.inventory),
    ]);

    return result;
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
    const response = await this.client.get<ApiResponse<AuthUser>>("/auth/me");
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

  async createAdmin(username: string, password: string): Promise<AuthUser> {
    if (!canReachServer()) {
      throw new Error("Admin yaratish uchun server kerak");
    }
    const response = await this.client.post<ApiResponse<AuthUser>>(
      "/auth/admins",
      { username, password },
    );
    return this.unwrap(response);
  }
}

export const apiClient = new ApiClient();
