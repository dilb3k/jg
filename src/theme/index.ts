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
  primary: "#6D28D9",
  primaryDark: "#5B21B6",
  primaryLight: "#7C3AED",
  
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
  background: "#EBF1F6",
  surface: "#ffffff",
  surfaceSecondary: "#f1f5f9",
  surfaceHover: "#f8fafc",
  
  // Text colors
  text: "#0f172a",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
  textInverse: "#ffffff",
  
  // Border colors
  border: "#e2e8f0",
  borderDark: "#cbd5e1",
  
  // Special colors
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0, 0, 0, 0.1)",
};

export const darkTheme: ThemeColors = {
  // Primary colors
  primary: "#7C3AED",
  primaryDark: "#6D28D9",
  primaryLight: "#8B5CF6",
  
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
  background: "#0f172a",
  surface: "#1e293b",
  surfaceSecondary: "#334155",
  surfaceHover: "#475569",
  
  // Text colors
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  textTertiary: "#64748b",
  textInverse: "#0f172a",
  
  // Border colors
  border: "#334155",
  borderDark: "#475569",
  
  // Special colors
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.3)",
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
};

// Font size constants
export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
};

// Border radius constants
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadow configurations - using boxShadow instead of deprecated shadow* props
export const SHADOWS = {
  sm: { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)', elevation: 1 },
  md: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', elevation: 3 },
  lg: { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)', elevation: 5 },
};
