import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "device_uuid";

const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getDeviceId = async (): Promise<string> => {
  try {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) return stored;

    const uuid = generateUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, uuid);
    return uuid;
  } catch {
    return generateUUID();
  }
};
