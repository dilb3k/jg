import { create } from 'zustand';
import { useColorScheme, type ColorSchemeName } from 'react-native';
import * as secureStorage from '../utils/secureStorage';
import { STORAGE_KEYS } from '../constants';
import type { ThemeMode } from '../theme';
import { lightTheme, getThemeColors } from '../theme';

interface ThemeStore {
  theme: ThemeMode;
  language: 'uz' | 'ru';
  colors: typeof lightTheme;
  isDark: boolean;
  systemColorScheme: 'light' | 'dark' | null;
  
  // Actions
  setTheme: (theme: ThemeMode) => Promise<void>;
  setLanguage: (language: 'uz' | 'ru') => Promise<void>;
  toggleTheme: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  setSystemColorScheme: (scheme: ColorSchemeName) => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'light',
  language: 'uz',
  colors: lightTheme,
  isDark: false,
  systemColorScheme: null,

  setTheme: async (newTheme: ThemeMode) => {
    const { systemColorScheme } = get();
    const colors = getThemeColors(newTheme, systemColorScheme);
    const isDark = newTheme === 'dark' || (newTheme === 'system' && systemColorScheme === 'dark');
    
    set({ theme: newTheme, colors, isDark });
    
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

  toggleTheme: async () => {
    const { theme } = get();
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    await get().setTheme(newTheme);
  },

  loadPreferences: async () => {
    try {
      const [savedTheme, savedLanguage] = await Promise.all([
        secureStorage.getItemAsync(STORAGE_KEYS.THEME),
        secureStorage.getItemAsync(STORAGE_KEYS.LANGUAGE),
      ]);

      const theme = (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') 
        ? savedTheme 
        : 'light';
      const language = (savedLanguage === 'uz' || savedLanguage === 'ru') 
        ? savedLanguage 
        : 'uz';

      const { systemColorScheme } = get();
      const colors = getThemeColors(theme, systemColorScheme);
      const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');

      set({ theme, language, colors, isDark });
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  },

  setSystemColorScheme: (scheme: ColorSchemeName) => {
    const systemColorScheme = scheme === 'light' || scheme === 'dark' ? scheme : null;
    const { theme } = get();
    const colors = getThemeColors(theme, systemColorScheme);
    const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
    
    set({ systemColorScheme, colors, isDark });
  },
}));

// Custom hook that syncs with system color scheme
export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const store = useThemeStore();
  
  // Sync system color scheme
  store.setSystemColorScheme(systemColorScheme);
  
  return {
    theme: store.theme,
    language: store.language,
    colors: store.colors,
    isDark: store.isDark,
    setTheme: store.setTheme,
    setLanguage: store.setLanguage,
    toggleTheme: store.toggleTheme,
  };
};

// Hook specifically for theme colors
export const useThemeColors = () => {
  const systemColorScheme = useColorScheme();
  const store = useThemeStore();
  store.setSystemColorScheme(systemColorScheme);
  return store.colors;
};

// Hook specifically for language
export const useLanguage = () => {
  const store = useThemeStore();
  return {
    language: store.language,
    setLanguage: store.setLanguage,
  };
};