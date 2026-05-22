import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import HisvexSplashScreen from "../src/components/HisvexSplashScreen";
import { useStore } from "../src/store";
import { useEffect, useState, useCallback } from "react";
import { initDatabase } from "../src/db";
import * as secureStorage from "../src/utils/secureStorage";
import { STORAGE_KEYS } from "../src/constants";
import { apiClient, setConnectionMode as setApiConnectionMode } from "../src/api/client";
import type { AuthUser } from "../src/types";
import { clearAllProducts } from "../src/db/products";
import { clearAllInventory } from "../src/db/inventory";
import { useTheme, useThemeStore } from "../src/store/themeStore";
import { useStatusBarStyle } from "../src/theme";
import * as Font from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync();

export default function RootLayoutNav() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splashFinished, setSplashFinished] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const storeAuth = useStore((state) => state.isAuthenticated);
  const initialize = useStore((state) => state.initialize);
  const toast = useStore((state) => state.toast);

  // Theme integration - use selectors to avoid re-renders
  const { theme } = useTheme();
  const statusBarStyle = useStatusBarStyle(theme);
  const loadPreferences = useThemeStore((state) => state.loadPreferences);

  // Memoize loadPreferences to avoid dependency warnings
  const loadPrefs = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    // Load theme and language preferences
    loadPrefs();
  }, [loadPrefs]);

  // Register connection mode change handler early so ERR_NETWORK during init updates the store
  const setThemeConnectionMode = useThemeStore((state) => state.setConnectionMode);
  const themeConnectionMode = useThemeStore((state) => state.connectionMode);
  useEffect(() => {
    apiClient.setConnectionModeChangeHandler((mode) => {
      setThemeConnectionMode(mode);
    });
    return () => {
      apiClient.setConnectionModeChangeHandler(null);
    };
  }, [setThemeConnectionMode]);

  // Sync store connection mode to module on changes (e.g. after loadPreferences)
  useEffect(() => {
    setApiConnectionMode(themeConnectionMode);
  }, [themeConnectionMode]);

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();

        await Font.loadAsync({
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        });

        await SplashScreen.hideAsync();

        const token = await secureStorage.getItemAsync(STORAGE_KEYS.USER_TOKEN);

        if (!token) {
          setIsAuthenticated(false);
          setIsReady(true);
          setSplashFinished(true);
          return;
        }

        apiClient.setToken(token);
        let isAuthenticatedUser = false;
        let freshUser: AuthUser | null = null;
        const userJson = await secureStorage.getItemAsync(STORAGE_KEYS.AUTH_USER);
        let localUser: AuthUser | null = null;
        try {
          localUser = JSON.parse(userJson || "null");
        } catch {}

        try {
          console.log("Fetching /api/auth/me to verify token and get latest data...");
          freshUser = await apiClient.getMe();
          console.log("Fetched user from server:", freshUser.username);

          const userData = {
            id: (freshUser as any).id || (freshUser as any).userId,
            username: freshUser.username,
            role: freshUser.role,
            createdBy: (freshUser as any).createdBy,
            isActive: (freshUser as any).isActive ?? true,
            isPayed: freshUser.role === "superAdmin" ? true : ((freshUser as any).isPayed ?? false),
            tier: (freshUser as any).tier ?? (freshUser.role === "superAdmin" ? "pro" : "tekin"),
            subscriptionEndDate: (freshUser as any).subscriptionEndDate ?? null,
            businessDayStartHour: (freshUser as any).businessDayStartHour ?? 6,
            createdAt: (freshUser as any).createdAt,
            updatedAt: (freshUser as any).updatedAt,
          };

          await secureStorage.setItemAsync(
            STORAGE_KEYS.AUTH_USER,
            JSON.stringify(userData)
          );
          isAuthenticatedUser = true;
        } catch (meError: any) {
          const errorMsg = meError.message || "";
          const isNetworkError = errorMsg.includes("Tarmoq") || errorMsg.includes("Internet") || errorMsg.includes("aloqa");

          if (isNetworkError && localUser) {
            console.log("Network error, using locally stored user:", localUser.username);
            isAuthenticatedUser = true;
          } else {
            console.error("Auth/other error, clearing token + local data:", errorMsg);
            await Promise.all([
              secureStorage.deleteItemAsync(STORAGE_KEYS.USER_TOKEN),
              secureStorage.deleteItemAsync(STORAGE_KEYS.AUTH_USER),
              clearAllProducts(),
              clearAllInventory(),
            ]);
            apiClient.setToken(null);
          }
        }

        if (isAuthenticatedUser) {
          console.log("Initializing store...");
          try {
            const initPromise = initialize();
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Tizim javob bermadi. Internetni tekshiring.")), 30000)
            );
            await Promise.race([initPromise, timeoutPromise]);
            console.log("Store initialized");
          } catch (initError: any) {
            console.error("Store initialization failed:", initError);
            await secureStorage.deleteItemAsync(STORAGE_KEYS.USER_TOKEN);
            await secureStorage.deleteItemAsync(STORAGE_KEYS.AUTH_USER);
            apiClient.setToken(null);
            useStore.setState({ user: null, isAuthenticated: false });
            isAuthenticatedUser = false;
          }
        }

        setIsAuthenticated(isAuthenticatedUser);
        setIsReady(true);
      } catch (err: any) {
        console.error("Init error:", err);
        setError(err.message || "Initialization failed");
      }
    };
    init();
  }, [initialize]);

  // Sync store auth changes to local state after init (e.g. on logout)
  useEffect(() => {
    if (isReady) {
      setIsAuthenticated(storeAuth);
    }
  }, [storeAuth, isReady]);

  if (error) {
    return (
      <View style={errorStyles.container}>
        <Text style={errorStyles.title}>Xatolik yuz berdi</Text>
        <Text style={errorStyles.message}>{error}</Text>
      </View>
    );
  }

  if (!splashFinished || !isReady || isAuthenticated === null) {
    return <HisvexSplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style={statusBarStyle} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack>
        {toast.visible && (
          <View
            style={[
              toastStyles.toast,
              toast.type === "success"
                ? { backgroundColor: "rgba(15, 23, 42, 0.86)" }
                : toast.type === "error"
                  ? { backgroundColor: "rgba(127, 29, 29, 0.92)" }
                  : { backgroundColor: "rgba(30, 41, 59, 0.88)" },
              { pointerEvents: "none" },
            ]}
          >
            <Text style={toastStyles.toastText}>{toast.message}</Text>
          </View>
        )}
      </>
    );
  }

  // Show main app if authenticated
  return (
    <>
      <StatusBar style={statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {toast.visible && (
        <View
          style={[
            toastStyles.toast,
            toast.type === "success"
              ? { backgroundColor: "rgba(15, 23, 42, 0.86)" }
              : toast.type === "error"
                ? { backgroundColor: "rgba(127, 29, 29, 0.92)" }
                : { backgroundColor: "rgba(30, 41, 59, 0.88)" },
            { pointerEvents: "none" },
          ]}
        >
          <Text style={toastStyles.toastText}>{toast.message}</Text>
        </View>
      )}
    </>
  );
}

const toastStyles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    maxWidth: "82%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    zIndex: 9999,
    elevation: 3,
    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.08)",
  },
  toastText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0718",
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 20,
  },
});
