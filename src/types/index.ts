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

export interface InventoryWithProduct extends InventoryEntry {
  product: Product;
}

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
