import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import type { InventoryEntry, InventorySummary, Product } from '../types';
import { getBusinessDate } from '../utils/businessDay';

const SUMMARY_STORAGE_KEY = 'clubbar_inventory_summary';

const STORAGE_KEY = 'clubbar_inventory';

const isProductVisibleOnDate = (product: Product, date: string): boolean => {
  const productCreatedDate = dayjs(product.createdAt).format('YYYY-MM-DD');
  return productCreatedDate <= date;
};

export const getAllInventoryEntries = async (): Promise<InventoryEntry[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const entries: InventoryEntry[] = data ? JSON.parse(data) : [];
  return entries;
};

export const getInventoryByDate = async (date: string): Promise<InventoryEntry[]> => {
  const entries = await getAllInventoryEntries();
  return entries.filter(e => e.date === date);
};

export const getInventoryRange = async (from: string, to: string): Promise<InventoryEntry[]> => {
  const entries = await getAllInventoryEntries();
  return entries.filter(e => e.date >= from && e.date <= to);
};

export const getInventoryWithProduct = async (date: string): Promise<(InventoryEntry & { product: Product })[]> => {
  const { getAllProducts } = await import('./products');
  const allInventory = await getInventoryByDate(date);
  const allProducts = await getAllProducts();
  const products = allProducts.filter((p) => isProductVisibleOnDate(p, date));

  const result: (InventoryEntry & { product: Product })[] = [];
  const processedProductIds = new Set<string>();
  const newEntries: InventoryEntry[] = [];

  const prevDateStr = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
  const prevInventory = await getInventoryByDate(prevDateStr);

  for (const product of products) {
    const existingInv = allInventory.find(inv => inv.productId === product.localId);
    processedProductIds.add(product.localId);

    if (existingInv) {
      result.push({
        ...existingInv,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        product,
      });
    } else {
      const prevInv = prevInventory.find(inv => inv.productId === product.localId);
      let startQty = product.quantity || 0;
      let currentQty = product.quantity || 0;

    if (prevInv) {
      startQty = prevInv.currentQuantity;
      currentQty = prevInv.currentQuantity;
    }

      const newEntry: InventoryEntry = {
        id: undefined,
        localId: `${date}-${product.localId}`,
        deviceId: '',
        productId: product.localId,
        date,
        startQuantity: startQty,
        currentQuantity: currentQty,
        note: '',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      newEntries.push(newEntry);

      result.push({ ...newEntry, product });
    }
  }

  if (newEntries.length > 0) {
    await saveInventoryEntries(newEntries);
  }

  for (const inv of allInventory) {
    if (!processedProductIds.has(inv.productId)) {
      const product: Product = {
        localId: inv.productId,
        deviceId: inv.deviceId,
        entityType: 'product',
        name: "Noma'lum mahsulot",
        quantity: inv.currentQuantity,
        buyPrice: 0,
        sellPrice: 0,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
      };
      result.push({ ...inv, product });
    }
  }

  return result;
};

export const createInventoryEntry = async (entry: InventoryEntry): Promise<void> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const entries: InventoryEntry[] = data ? JSON.parse(data) : [];
  entries.push(entry);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const updateInventoryEntry = async (entry: InventoryEntry): Promise<void> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const entries: InventoryEntry[] = data ? JSON.parse(data) : [];
  const index = entries.findIndex(e => e.localId === entry.localId);
  if (index !== -1) {
    entries[index] = entry;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } else {
    entries.push(entry);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
};

export const syncTodayInventoryWithProducts = async (): Promise<void> => {
  const today = getBusinessDate();
  const { getAllProducts } = await import('./products');
  const products = (await getAllProducts());
  const entries = await getAllInventoryEntries();

  let hasChanges = false;
  const nextEntries = [...entries];

  const prevDateStr = dayjs(today).subtract(1, 'day').format('YYYY-MM-DD');
  const prevEntries = entries.filter((e) => e.date === prevDateStr);

  products.forEach((product) => {
    const index = nextEntries.findIndex(
      (entry) => entry.productId === product.localId && entry.date === today,
    );

    if (index === -1) {
      const prevInv = prevEntries.find((e) => e.productId === product.localId);
      const prevQty = prevInv ? prevInv.currentQuantity : 0;

      const newEntry: InventoryEntry = {
        id: undefined,
        localId: `${today}-${product.localId}`,
        deviceId: product.deviceId,
        productId: product.localId,
        date: today,
        startQuantity: prevQty,
        currentQuantity: prevQty,
        note: '',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      nextEntries.push(newEntry);
      hasChanges = true;
      return;
    }

    const existing = nextEntries[index];
    const priceChanged = existing.buyPrice !== product.buyPrice || existing.sellPrice !== product.sellPrice;

    if (priceChanged) {
      nextEntries[index] = {
        ...existing,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        updatedAt: new Date().toISOString(),
      };
      hasChanges = true;
    }
  });

  if (hasChanges) {
    await saveInventoryEntries(nextEntries);
  }
};

export const deleteInventoryByLocalId = async (localId: string): Promise<void> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const entries: InventoryEntry[] = data ? JSON.parse(data) : [];
  const index = entries.findIndex(e => e.localId === localId);
  if (index !== -1) {
    entries.splice(index, 1);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
};

export const saveInventoryEntries = async (entries: InventoryEntry[]): Promise<void> => {
  if (entries.length === 0) return;
  const validEntries = entries.filter(e =>
    e.date && e.localId &&
    typeof e.startQuantity === 'number' &&
    typeof e.currentQuantity === 'number' &&
    e.productId
  );
  if (validEntries.length === 0) return;
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const existing: InventoryEntry[] = data ? JSON.parse(data) : [];
  const existingByLocalId = new Map(existing.map(e => [e.localId, e]));
  for (const entry of validEntries) {
    existingByLocalId.set(entry.localId, entry);
  }
  const merged = Array.from(existingByLocalId.values());
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
};

export const saveInventorySummary = async (summary: InventorySummary): Promise<void> => {
  await AsyncStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(summary));
};

export const getInventorySummary = async (): Promise<InventorySummary | null> => {
  const data = await AsyncStorage.getItem(SUMMARY_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearAllInventory = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  await AsyncStorage.removeItem(SUMMARY_STORAGE_KEY);
};
