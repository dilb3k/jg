import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useStore } from "../src/store";
import { useEffect, useState, useCallback } from "react";
import { initDatabase } from "../src/db";
import * as secureStorage from "../src/utils/secureStorage";
import { STORAGE_KEYS } from "../src/constants";
import { apiClient } from "../src/api/client";
import type { AuthUser } from "../src/types";
import { useTheme, useThemeStore } from "../src/store/themeStore";
import { useStatusBarStyle } from "../src/theme";

export default function RootLayoutNav() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const initialize = useStore((state) => state.initialize);
  const toast = useStore((state) => state.toast);

  // Theme integration - use selectors to avoid re-renders
  const { theme, colors } = useTheme();
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

  useEffect(() => {
    const init = async () => {
      try {
        console.log("Initializing DB...");
        await initDatabase();
        console.log("DB initialized");

        const token = await secureStorage.getItemAsync(STORAGE_KEYS.USER_TOKEN);
        let isAuthenticatedUser = false;
        let freshUser: AuthUser | null = null;

        if (token) {
          apiClient.setToken(token);
          const userJson = await secureStorage.getItemAsync(STORAGE_KEYS.AUTH_USER);
          let localUser: AuthUser | null = null;
          try {
            localUser = JSON.parse(userJson || "null");
          } catch {}

          try {
            console.log("Fetching /api/auth/me to verify token and get latest data...");
            freshUser = await apiClient.getMe();
            console.log("Fetched user from server:", freshUser.username, "isPayed:", freshUser.isPayed);

            const userForStorage: AuthUser = {
              userId: freshUser.userId,
              username: freshUser.username,
              role: freshUser.role,
              isPayed: freshUser.role === "superAdmin" ? true : (freshUser.isPayed ?? false)
            };

            await secureStorage.setItemAsync(
              STORAGE_KEYS.AUTH_USER,
              JSON.stringify(userForStorage)
            );
            isAuthenticatedUser = true;
          } catch (meError: any) {
            const errorMsg = meError.message || "";
            const isAuthError = errorMsg.includes("Avtorizatsiya") || errorMsg.includes("401") || errorMsg.includes("Unauthorized");

            if (isAuthError) {
              console.error("Auth failed, clearing token:", errorMsg);
              await secureStorage.deleteItemAsync(STORAGE_KEYS.USER_TOKEN);
              await secureStorage.deleteItemAsync(STORAGE_KEYS.AUTH_USER);
              apiClient.setToken(null);
            } else if (localUser) {
              console.log("Network error, using locally stored user:", localUser.username);
              isAuthenticatedUser = true;
            } else {
              console.error("Network error and no local user:", errorMsg);
            }
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

  if (error) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.danger }]}>
          Error: {error}
        </Text>
      </View>
    );
  }

  if (!isReady || isAuthenticated === null) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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
              styles.toast,
              toast.type === "success"
                ? { backgroundColor: "rgba(15, 23, 42, 0.86)" }
                : toast.type === "error"
                  ? { backgroundColor: "rgba(127, 29, 29, 0.92)" }
                  : { backgroundColor: "rgba(30, 41, 59, 0.88)" },
              { pointerEvents: "none" },
            ]}
          >
            <Text style={styles.toastText}>{toast.message}</Text>
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
            styles.toast,
            toast.type === "success"
              ? { backgroundColor: "rgba(15, 23, 42, 0.86)" }
              : toast.type === "error"
                ? { backgroundColor: "rgba(127, 29, 29, 0.92)" }
                : { backgroundColor: "rgba(30, 41, 59, 0.88)" },
            { pointerEvents: "none" },
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
  },
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
