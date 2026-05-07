import axios, { AxiosError, AxiosInstance } from "axios";

import { API_BASE_URL } from "../constants";
import type {
  AuthUser,
  DailySnapshot,
  InventoryEntry,
  InventoryWithProduct,
  Product,
} from "../types";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type MongoDocument = {
  _id?: string;
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

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
      // Prevent stream issues by setting max content length
      maxContentLength: 10 * 1024 * 1024, // 10MB
      maxBodyLength: 10 * 1024 * 1024, // 10MB
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
        // Handle specific error types
        if (error.code === "ECONNABORTED") {
          return Promise.reject(
            new Error("So'rov vaqti tugadi. Internet aloqasini tekshiring."),
          );
        }
        if (error.code === "ERR_NETWORK") {
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
    const response = await this.client.get<ApiResponse<Product[]>>(
      "/products",
      {
        params: search ? { search } : undefined,
      },
    );
    return this.unwrap(response);
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.client.get<ApiResponse<Product>>(
      `/products/${id}`,
    );
    return this.unwrap(response);
  }

  async createProduct(product: Product): Promise<Product> {
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
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const {
      deviceId,
      name,
      quantity,
      buyPrice,
      sellPrice,
      image,
      localId,
      createdAt,
      updatedAt,
    } = product;

    const response = await this.client.put<ApiResponse<Product>>(
      `/products/${id}`,
      {
        deviceId,
        name,
        quantity,
        buyPrice,
        sellPrice,
        image,
        localId,
        createdAt,
        updatedAt,
      },
    );
    return this.unwrap(response);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.client.delete(`/products/${id}`);
  }

  async getInventory(date: string): Promise<InventoryEntry[]> {
    const response = await this.client.get<ApiResponse<InventoryEntry[]>>(
      "/inventory",
      {
        params: { date },
      },
    );
    return this.unwrap(response);
  }

  async getInventoryWithProducts(
    date: string,
    products?: Product[],
  ): Promise<InventoryWithProduct[]> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/inventory", {
        params: { date },
      });

      let data = this.unwrap(response);

      if (data && typeof data === "object" && Array.isArray(data.items)) {
        return data.items as InventoryWithProduct[];
      }

      if (Array.isArray(data)) {
        return data as InventoryWithProduct[];
      }
      const [inventory, resolvedProducts] = await Promise.all([
        this.getInventory(date),
        products ? Promise.resolve(products) : this.getProducts(),
      ]);

      return joinInventoryWithProducts(inventory, resolvedProducts);
    } catch (error: any) {
      console.error("getInventoryWithProducts error:", error.message);

      const [inventory, resolvedProducts] = await Promise.all([
        this.getInventory(date),
        products ? Promise.resolve(products) : this.getProducts(),
      ]);

      return joinInventoryWithProducts(inventory, resolvedProducts);
    }
  }

  async getInventoryRange(from: string, to: string): Promise<InventoryEntry[]> {
    const response = await this.client.get<ApiResponse<InventoryEntry[]>>(
      "/inventory/range",
      {
        params: { from, to },
      },
    );
    return this.unwrap(response);
  }

  async startDayInventory(
    deviceId: string,
    items: StartDayInventoryItem[],
    date?: string,
  ): Promise<void> {
    await this.client.post("/inventory/start-day", {
      deviceId,
      date,
      items,
    });
  }

  async bulkUpdateInventory(
    deviceId: string,
    items: BulkCurrentInventoryItem[],
    date?: string,
  ): Promise<void> {
    await this.client.put("/inventory/bulk-current", {
      deviceId,
      date,
      items,
    });
  }

  async getDailySnapshot(date: string): Promise<DailySnapshot> {
    const response = await this.client.get<ApiResponse<DailySnapshot>>(
      "/snapshots/daily",
      {
        params: { date },
      },
    );
    return this.unwrap(response);
  }

  async getSnapshotsRange(from: string, to: string): Promise<DailySnapshot[]> {
    const response = await this.client.get<ApiResponse<DailySnapshot[]>>(
      "/snapshots/range",
      {
        params: { from, to },
      },
    );
    return this.unwrap(response);
  }

  async createDailySnapshot(snapshot: DailySnapshot): Promise<DailySnapshot> {
    const response = await this.client.post<ApiResponse<DailySnapshot>>(
      "/snapshots/daily",
      snapshot,
    );
    return this.unwrap(response);
  }

  async sync(data: {
    products?: Product[];
    inventory?: InventoryEntry[];
    snapshots?: DailySnapshot[];
    lastSyncAt?: string;
  }): Promise<{
    products: Product[];
    inventory: InventoryEntry[];
    snapshots: DailySnapshot[];
    serverTime: string;
  }> {
    const response = await this.client.post<
      ApiResponse<{
        products: Product[];
        inventory: InventoryEntry[];
        snapshots: DailySnapshot[];
        serverTime: string;
      }>
    >("/sync", data);

    return this.unwrap(response);
  }

  // Auth methods
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
    const response =
      await this.client.get<ApiResponse<AuthUser[]>>("/auth/admins");
    return this.unwrap(response);
  }

  async createAdmin(username: string, password: string): Promise<AuthUser> {
    const response = await this.client.post<ApiResponse<AuthUser>>(
      "/auth/admins",
      {
        username,
        password,
      },
    );
    return this.unwrap(response);
  }
}

export const apiClient = new ApiClient();
