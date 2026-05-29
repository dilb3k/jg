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
  displayIndex?: number;
  barcodes?: string[];
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
  buyPrice?: number;
  sellPrice?: number;
  sold?: number;
  revenue?: number;
  realizedProfit?: number;
  note?: string;
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
  updatedAt: string;
  createdAt: string;
}

export interface InventorySummary {
  totalStart: number;
  totalCurrent: number;
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
  totalStockSellValue: number;
  totalStockBuyValue: number;
  totalStockProfit: number;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'product' | 'inventory' | 'snapshot';
  operation: 'upsert' | 'delete';
  data: unknown;
  createdAt: string;
}

export interface AppMeta {
  key: string;
  value: string;
}

export type ProductInput = Omit<Product, 'id' | 'localId' | 'deviceId' | 'updatedAt' | 'createdAt'> & { quantity?: number };
export type InventoryInput = Omit<InventoryEntry, 'id' | 'localId' | 'deviceId' | 'updatedAt' | 'createdAt'>;
export type SnapshotInput = Omit<DailySnapshot, 'id' | 'localId' | 'deviceId' | 'updatedAt' | 'createdAt'>;

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

export interface Debtor {
  id: string;
  createdBy: string;
  name: string;
  amount: number;
  phone?: string;
  notes?: string;
  history: DebtHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface DebtHistory {
  amount: number;
  type: "add" | "subtract";
  note?: string;
  date: string;
}

export type SubscriptionTier = "tekin" | "bor" | "pro";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  createdBy: string | null;
  isActive: boolean;
  isPayed: boolean;
  tier: SubscriptionTier;
  subscriptionEndDate?: string | null;
  businessDayStartHour?: number;
  blockCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
}

export interface DatabaseStats {
  database: {
    name: string;
    size: string;
    storageSize: string;
    indexSize: string;
    totalSize: string;
    collections: number;
    objects: number;
    avgObjectSize: string;
  };
  records: {
    totalAdmins: number;
    totalProducts: number;
    totalInventory: number;
    totalSnapshots: number;
    totalDebtors: number;
    totalSubscriptions: number;
    totalActiveSubscriptions: number;
    totalRecords: number;
  };
  collections?: Record<string, { count: number; size: string }>;
}