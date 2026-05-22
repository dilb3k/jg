import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const canUseSecureStore = (): boolean =>
  Platform.OS !== "web" &&
  typeof SecureStore.getItemAsync === "function" &&
  typeof SecureStore.setItemAsync === "function" &&
  typeof SecureStore.deleteItemAsync === "function";

export const getItemAsync = async (key: string): Promise<string | null> => {
  if (canUseSecureStore()) {
    return await SecureStore.getItemAsync(key);
  }

  return AsyncStorage.getItem(key);
};

export const setItemAsync = async (
  key: string,
  value: string,
): Promise<void> => {
  if (canUseSecureStore()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  await AsyncStorage.setItem(key, value);
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  if (canUseSecureStore()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  await AsyncStorage.removeItem(key);
};
