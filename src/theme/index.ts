import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Secondary colors
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  
  // Status colors
  danger: string;
  dangerDark: string;
  warning: string;
  success: string;
  
  // Background colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceHover: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border colors
  border: string;
  borderDark: string;
  
  // Special colors
  white: string;
  black: string;
  overlay: string;
  shadow: string;
}

export const lightTheme: ThemeColors = {
  // Primary colors
  primary: "#8B5CF6",
  primaryDark: "#7C3AED",
  primaryLight: "#A78BFA",
  
  // Secondary colors
  secondary: "#10b981",
  secondaryDark: "#059669",
  secondaryLight: "#34d399",
  
  // Status colors
  danger: "#ef4444",
  dangerDark: "#dc2626",
  warning: "#f59e0b",
  success: "#22c55e",
  
  // Background colors
  background: "#F0F2F5",
  surface: "#ffffff",
  surfaceSecondary: "#f4f5f7",
  surfaceHover: "#fafbfc",
  
  // Text colors
  text: "#0f172a",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
  textInverse: "#ffffff",
  
  // Border colors
  border: "#e8ecf0",
  borderDark: "#d0d5dd",
  
  // Special colors
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.4)",
  shadow: "rgba(0, 0, 0, 0.08)",
};

export const darkTheme: ThemeColors = {
  // Primary colors
  primary: "#8B5CF6",
  primaryDark: "#7C3AED",
  primaryLight: "#A78BFA",
  
  // Secondary colors
  secondary: "#34d399",
  secondaryDark: "#10b981",
  secondaryLight: "#6ee7b7",
  
  // Status colors
  danger: "#f87171",
  dangerDark: "#ef4444",
  warning: "#fbbf24",
  success: "#4ade80",
  
  // Background colors
  background: "#0b1120",
  surface: "#131c31",
  surfaceSecondary: "#1a2640",
  surfaceHover: "#223054",
  
  // Text colors
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  textTertiary: "#64748b",
  textInverse: "#0f172a",
  
  // Border colors
  border: "#1e2a45",
  borderDark: "#2a3a5c",
  
  // Special colors
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.4)",
};

/**
 * Hook to get the current theme based on the theme mode
 */
export const useTheme = (mode: ThemeMode = 'light'): ThemeColors => {
  const systemColorScheme = useColorScheme();
  
  if (mode === 'system') {
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
};

/**
 * Hook to get the status bar style based on theme mode
 */
export const useStatusBarStyle = (mode: ThemeMode = 'light'): 'light' | 'dark' => {
  const systemColorScheme = useColorScheme();
  
  if (mode === 'system') {
    return systemColorScheme === 'dark' ? 'light' : 'dark';
  }
  return mode === 'dark' ? 'light' : 'dark';
};

/**
 * Get theme colors without hook (for non-component code)
 */
export const getThemeColors = (mode: ThemeMode, systemColorScheme: 'light' | 'dark' | null = null): ThemeColors => {
  if (mode === 'system') {
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
};

// Font family constants
export const FONT_FAMILY = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

// Spacing constants
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  massive: 40,
};

// Font size constants
export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 19,
  xxl: 22,
  xxxl: 26,
  title: 30,
};

// Border radius constants
export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

// Shadow configurations - using boxShadow for modern RN, elevation for Android
export const SHADOWS = {
  sm: {
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  md: {
    boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.09)',
    elevation: 4,
  },
  lg: {
    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.12)',
    elevation: 6,
  },
  xl: {
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
};
