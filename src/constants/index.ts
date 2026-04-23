export const COLORS = {
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  primaryLight: "#818cf8",
  secondary: "#10b981",
  secondaryDark: "#059669",
  secondaryLight: "#34d399",
  danger: "#ef4444",
  dangerDark: "#dc2626",
  warning: "#f59e0b",
  success: "#22c55e",
  background: "#EBF1F6",
  surface: "#ffffff",
  surfaceSecondary: "#f1f5f9",
  text: "#0f172a",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
  border: "#e2e8f0",
  borderDark: "#cbd5e1",
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.5)",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
};

export const API_BASE_URL = 'https://comp-bar-server-1.onrender.com/api';

export const STORAGE_KEYS = {
  DEVICE_ID: 'device_id',
  LAST_SYNC: 'last_sync',
  USER_TOKEN: 'user_token',
};

export const TABLE_NAMES = {
  PRODUCTS: 'products',
  INVENTORY_ENTRIES: 'inventory_entries',
  DAILY_SNAPSHOTS: 'daily_snapshots',
  SYNC_QUEUE: 'sync_queue',
  APP_META: 'app_meta',
};

export const ENTITY_TYPES = {
  PRODUCT: 'product',
  INVENTORY: 'inventory',
  SNAPSHOT: 'snapshot',
} as const;

export const OPERATION_TYPES = {
  UPSERT: 'upsert',
  DELETE: 'delete',
} as const;
