import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '../types';

const STORAGE_KEY = 'clubbar_products';

export const sortProductsByDisplayIndex = (products: Product[]): Product[] => {
  return [...products].sort((a, b) => {
    const indexA = a.displayIndex ?? 0;
    const indexB = b.displayIndex ?? 0;
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return a.name.localeCompare(b.name);
  });
};

export const getAllProducts = async (): Promise<Product[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getProductByLocalId = async (localId: string): Promise<Product | null> => {
  const products = await getAllProducts();
  return products.find(p => p.localId === localId) || null;
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const products = await getAllProducts();
  const q = query.toLowerCase();
  return products.filter(p => p.name.toLowerCase().includes(q));
};

export const createProduct = async (product: Product): Promise<void> => {
  const products = await getAllProducts();
  const existing = products.find((p) => p.localId === product.localId);
  if (existing) {
    const index = products.findIndex((p) => p.localId === product.localId);
    products[index] = product;
  } else {
    products.push(product);
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

export const updateProduct = async (product: Product): Promise<void> => {
  const products = await getAllProducts();
  const index = products.findIndex(p => p.localId === product.localId);
  if (index !== -1) {
    products[index] = product;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }
};

export const deleteProductByLocalId = async (localId: string): Promise<void> => {
  const products = await getAllProducts();
  const index = products.findIndex(p => p.localId === localId);
  if (index !== -1) {
    products.splice(index, 1);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }
};

export const saveProducts = async (products: Product[]): Promise<void> => {
  const existingData = await AsyncStorage.getItem(STORAGE_KEY);
  const existing: Product[] = existingData ? JSON.parse(existingData) : [];
  const existingByLocalId = new Map(existing.map((p) => [p.localId, p]));
  for (const product of products) {
    existingByLocalId.set(product.localId, product);
  }
  const merged = Array.from(existingByLocalId.values());
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
};

export const clearAllProducts = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};