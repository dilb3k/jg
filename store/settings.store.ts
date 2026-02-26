import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type AppLanguage = "uz" | "ru" | "en";

type SettingsState = {
  language: AppLanguage;
  pushNotificationsEnabled: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setPushNotificationsEnabled: (enabled: boolean) => Promise<void>;
};

const PUSH_KEY = "app_push_notifications";
const LANGUAGE_KEY = "app_language";

const isAppLanguage = (value: string | null): value is AppLanguage =>
  value === "uz" || value === "ru" || value === "en";

export const useSettingsStore = create<SettingsState>((set) => ({
  language: "ru",
  pushNotificationsEnabled: true,
  hydrated: false,

  hydrate: async () => {
    const pushNotificationsEnabled = await AsyncStorage.getItem(PUSH_KEY);
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

    set({
      language: isAppLanguage(savedLanguage) ? savedLanguage : "ru",
      pushNotificationsEnabled: pushNotificationsEnabled !== "false",
      hydrated: true,
    });
  },

  setLanguage: async (language) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    set({ language });
  },

  setPushNotificationsEnabled: async (enabled) => {
    await AsyncStorage.setItem(PUSH_KEY, String(enabled));
    set({ pushNotificationsEnabled: enabled });
  },
}));
