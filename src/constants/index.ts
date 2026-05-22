// Re-export theme constants for backward compatibility
export { SPACING, FONT_SIZE, FONT_FAMILY, BORDER_RADIUS, SHADOWS } from '../theme';

// Light theme colors as default for backward compatibility
export const COLORS = {
  primary: "#7C3AED",
  primaryDark: "#6D28D9",
  primaryLight: "#8B5CF6",
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

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://comp-bar-server-1.onrender.com/api';
// IMPORTANT: Must match BUSINESS_DAY_START_HOUR in bar-backend/backend/src/config/env.ts (default 0)
export const BUSINESS_DAY_START_HOUR = Number(process.env.EXPO_PUBLIC_BUSINESS_DAY_START_HOUR) || 6;

export const STORAGE_KEYS = {
  DEVICE_ID: 'device_id',
  LAST_SYNC: 'last_sync',
  USER_TOKEN: 'user_token',
  AUTH_USER: 'auth_user',
  LANGUAGE: 'language',
  THEME: 'theme',
  CONNECTION_MODE: 'connection_mode',
  BUSINESS_DAY_START_HOUR: 'business_day_start_hour',
  PENDING_BUSINESS_DAY_HOUR: 'pending_business_day_hour',
  BUSINESS_DAY_EFFECTIVE_FROM: 'business_day_effective_from',
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

