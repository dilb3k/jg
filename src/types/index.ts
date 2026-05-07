export interface Product {
  id?: string;
  localId: string;
  deviceId: string;
  entityType?: "product";
  name: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  image?: string;
  isDeleted: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface InventoryEntry {
  id?: string;
  localId: string;
  deviceId: string;
  entityType?: "inventory";
  productId: string;
  date: string;
  startQuantity: number;
  currentQuantity: number;
  note?: string;
  isDeleted: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface InventoryMetrics {
  remaining: number;
  sold: number;
  revenue: number;
  realizedProfit: number;
  stockSellValue: number;
  stockBuyValue: number;
  potentialProfit: number;
  marginPercent: number;
}

export interface InventoryWithProduct extends InventoryEntry {
  product: Product;
  remaining?: number;
  sold?: number;
  revenue?: number;
  realizedProfit?: number;
  stockSellValue?: number;
  stockBuyValue?: number;
  potentialProfit?: number;
  marginPercent?: number;
}
export interface DailySnapshotItem {
  productId: string;
  productName: string;
  sold: number;
  buyPrice?: number;
  sellPrice?: number;
  revenue: number;
  profit: number;
}

export interface DailySnapshot {
  id?: string;
  localId: string;
  deviceId: string;
  date: string;
  totalRevenue: number;
  totalProfit: number;
  totalSoldItems: number;
  items: DailySnapshotItem[];
  isDeleted: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  entity: 'product' | 'inventory' | 'snapshot';
  operation: 'upsert' | 'delete';
  payload: unknown;
  createdAt: string;
}

export interface AppMeta {
  key: string;
  value: string;
}

export type ProductInput = Omit<Product, 'id' | 'localId' | 'deviceId' | 'updatedAt' | 'createdAt' | 'isDeleted'> & { quantity?: number };
export type InventoryInput = Omit<InventoryEntry, 'id' | 'localId' | 'deviceId' | 'updatedAt' | 'createdAt' | 'isDeleted'>;
export type SnapshotInput = Omit<DailySnapshot, 'id' | 'localId' | 'deviceId' | 'updatedAt' | 'createdAt' | 'isDeleted'>;

export interface StatisticsData {
  date: string;
  totalRevenue: number;
  totalProfit: number;
  totalSoldItems: number;
  items: DailySnapshotItem[];
}

export type StatisticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  isSyncing: boolean;
}

// Auth types
export type UserRole = 'admin' | 'superAdmin';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  createdBy: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
}