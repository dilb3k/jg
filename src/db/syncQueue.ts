import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SyncQueueItem, AppMeta } from '../types';

const SYNC_QUEUE_KEY = 'clubbar_sync_queue';
const APP_META_KEY = 'clubbar_app_meta';

export const addToSyncQueue = async (item: SyncQueueItem): Promise<void> => {
  const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  const queue: SyncQueueItem[] = data ? JSON.parse(data) : [];
  queue.push(item);
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearSyncQueue = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  const queue: SyncQueueItem[] = data ? JSON.parse(data) : [];
  const filtered = queue.filter(item => !ids.includes(item.id));
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
};

export const getSyncQueueCount = async (): Promise<number> => {
  const queue = await getSyncQueue();
  return queue.length;
};

export const getAppMeta = async (key: string): Promise<string | null> => {
  const data = await AsyncStorage.getItem(APP_META_KEY);
  const meta: Record<string, string> = data ? JSON.parse(data) : {};
  return meta[key] || null;
};

export const setAppMeta = async (key: string, value: string): Promise<void> => {
  const data = await AsyncStorage.getItem(APP_META_KEY);
  const meta: Record<string, string> = data ? JSON.parse(data) : {};
  meta[key] = value;
  await AsyncStorage.setItem(APP_META_KEY, JSON.stringify(meta));
};

export const clearAllSyncQueue = async (): Promise<void> => {
  await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
};

export const getAppMetaAll = async (): Promise<AppMeta[]> => {
  const data = await AsyncStorage.getItem(APP_META_KEY);
  const meta: Record<string, string> = data ? JSON.parse(data) : {};
  return Object.entries(meta).map(([key, value]) => ({ key, value }));
};