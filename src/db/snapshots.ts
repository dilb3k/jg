import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailySnapshot, DailySnapshotItem } from '../types';

const STORAGE_KEY = 'clubbar_snapshots';

interface StoredSnapshot extends Omit<DailySnapshot, 'items'> {
  items: string;
}

export const getSnapshotByDate = async (date: string): Promise<DailySnapshot | null> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const snapshots: StoredSnapshot[] = data ? JSON.parse(data) : [];
  const found = snapshots.find(s => s.date === date && !s.isDeleted);
  if (!found) return null;
  return { ...found, items: JSON.parse(found.items) };
};

export const getSnapshotsRange = async (from: string, to: string): Promise<DailySnapshot[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const snapshots: StoredSnapshot[] = data ? JSON.parse(data) : [];
  return snapshots
    .filter(s => s.date >= from && s.date <= to && !s.isDeleted)
    .map(s => ({ ...s, items: JSON.parse(s.items) as DailySnapshotItem[] }));
};

export const createSnapshot = async (snapshot: DailySnapshot): Promise<void> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const snapshots: StoredSnapshot[] = data ? JSON.parse(data) : [];
  const toStore: StoredSnapshot = { ...snapshot, items: JSON.stringify(snapshot.items) };
  snapshots.push(toStore);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
};

export const updateSnapshot = async (snapshot: DailySnapshot): Promise<void> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const snapshots: StoredSnapshot[] = data ? JSON.parse(data) : [];
  const index = snapshots.findIndex(s => s.localId === snapshot.localId);
  if (index !== -1) {
    snapshots[index] = { ...snapshot, items: JSON.stringify(snapshot.items) };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } else {
    await createSnapshot(snapshot);
  }
};

export const deleteSnapshotByLocalId = async (localId: string): Promise<void> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const snapshots: StoredSnapshot[] = data ? JSON.parse(data) : [];
  const index = snapshots.findIndex(s => s.localId === localId);
  if (index !== -1) {
    snapshots[index].isDeleted = true;
    snapshots[index].updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  }
};

export const saveSnapshots = async (snapshots: DailySnapshot[]): Promise<void> => {
  if (snapshots.length === 0) return;
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const existing: StoredSnapshot[] = data ? JSON.parse(data) : [];
  const existingByLocalId = new Map(existing.map(s => [s.localId, s]));
  for (const snapshot of snapshots) {
    existingByLocalId.set(snapshot.localId, { ...snapshot, items: JSON.stringify(snapshot.items) });
  }
  const merged = Array.from(existingByLocalId.values());
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
};

export const getAllSnapshots = async (): Promise<DailySnapshot[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const snapshots: StoredSnapshot[] = data ? JSON.parse(data) : [];
  return snapshots
    .filter(s => !s.isDeleted)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(s => ({ ...s, items: JSON.parse(s.items) as DailySnapshotItem[] }));
};