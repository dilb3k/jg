import { create } from 'zustand';
import { useColorScheme } from 'react-native';
import * as secureStorage from '../utils/secureStorage';
import { STORAGE_KEYS } from '../constants';
import type { ThemeMode } from '../theme';
import { getThemeColors } from '../theme';
import { setConnectionMode as setApiConnectionMode } from '../api/client';

export type ConnectionMode = 'online' | 'offline';

interface ThemeStore {
  theme: ThemeMode;
  language: 'uz' | 'ru';
  connectionMode: ConnectionMode;
  
  // Actions
  setTheme: (theme: ThemeMode) => Promise<void>;
  setLanguage: (language: 'uz' | 'ru') => Promise<void>;
  setConnectionMode: (mode: ConnectionMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  loadPreferences: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'light',
  language: 'uz',
  connectionMode: 'online',

  setTheme: async (newTheme: ThemeMode) => {
    set({ theme: newTheme });
    
    try {
      await secureStorage.setItemAsync(STORAGE_KEYS.THEME, newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  },

  setLanguage: async (newLanguage: 'uz' | 'ru') => {
    set({ language: newLanguage });
    
    try {
      await secureStorage.setItemAsync(STORAGE_KEYS.LANGUAGE, newLanguage);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  },

  setConnectionMode: async (newMode: ConnectionMode) => {
    set({ connectionMode: newMode });
    setApiConnectionMode(newMode);
    
    try {
      await secureStorage.setItemAsync(STORAGE_KEYS.CONNECTION_MODE, newMode);
    } catch (error) {
      console.error('Failed to save connection mode preference:', error);
    }
  },

  toggleTheme: async () => {
    const { theme } = get();
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    await get().setTheme(newTheme);
  },

  loadPreferences: async () => {
    try {
      const [savedTheme, savedLanguage, savedConnectionMode] = await Promise.all([
        secureStorage.getItemAsync(STORAGE_KEYS.THEME),
        secureStorage.getItemAsync(STORAGE_KEYS.LANGUAGE),
        secureStorage.getItemAsync(STORAGE_KEYS.CONNECTION_MODE),
      ]);

      const theme = (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') 
        ? savedTheme 
        : 'light';
      const language = (savedLanguage === 'uz' || savedLanguage === 'ru') 
        ? savedLanguage 
        : 'uz';
      const connectionMode = (savedConnectionMode === 'online' || savedConnectionMode === 'offline')
        ? savedConnectionMode
        : 'online';

      set({ theme, language, connectionMode });
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  },
}));

// Custom hook that syncs with system color scheme
export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const store = useThemeStore();

  // Compute derived values based on user theme preference and system scheme
  const effectiveTheme = store.theme === 'system' ? systemColorScheme : store.theme;
  const isDark = effectiveTheme === 'dark';
  const colors = getThemeColors(store.theme, systemColorScheme);

  return {
    theme: store.theme,
    language: store.language,
    connectionMode: store.connectionMode,
    colors,
    isDark,
    setTheme: store.setTheme,
    setLanguage: store.setLanguage,
    setConnectionMode: store.setConnectionMode,
    toggleTheme: store.toggleTheme,
  };
};

// Hook specifically for theme colors
export const useThemeColors = () => {
  const systemColorScheme = useColorScheme();
  const store = useThemeStore();
  return getThemeColors(store.theme, systemColorScheme);
};

// Hook specifically for language
export const useLanguage = () => {
  const store = useThemeStore();
  return {
    language: store.language,
    setLanguage: store.setLanguage,
  };
};