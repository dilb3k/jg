import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '../types';

const STORAGE_KEY = 'clubbar_products';

export const getAllProducts = async (): Promise<Product[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getProductByLocalId = async (localId: string): Promise<Product | null> => {
  const products = await getAllProducts();
  return products.find(p => p.localId === localId && !p.isDeleted) || null;
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const products = await getAllProducts();
  const q = query.toLowerCase();
  return products.filter(p => !p.isDeleted && (p.name.toLowerCase().includes(q)));
};

export const createProduct = async (product: Product): Promise<void> => {
  const products = await getAllProducts();
  products.push(product);
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
    products[index].isDeleted = true;
    products[index].updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }
};

export const saveProducts = async (products: Product[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};