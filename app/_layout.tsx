import { OfflineNotice } from "@/shared/ui/OfflineNotice";
import { ToastProvider } from "@/shared/ui/toast";
import { useAuthStore } from "@/store/auth.store";
import { useNetworkStore } from "@/store/network.store";
import { useSettingsStore } from "@/store/settings.store";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "../global.css";

export default function RootLayout() {
  const { hydrate, hydrated, accessToken, sessionExpired, clearSessionExpired } = useAuthStore();
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const startMonitoring = useNetworkStore((state) => state.startMonitoring);
  const stopMonitoring = useNetworkStore((state) => state.stopMonitoring);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const initAuth = async () => {
      try {
        await Promise.all([hydrate(), hydrateSettings()]);
      } catch (error) {
        console.error("Auth hydration error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [hydrate, hydrateSettings]);

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  useEffect(() => {
    if (isLoading || !hydrated) return;

    const firstSegment = segments[0];
    const secondSegment = segments[1];
    const inAuth = firstSegment === "(auth)";
    const inTabs = firstSegment === "(tabs)";
    const inMovie = firstSegment === "movie";
    const inPasswordResetFlow =
      inAuth &&
      (secondSegment === "forgot-password" ||
        secondSegment === "verify-reset-code" ||
        secondSegment === "reset-password");
    const inProtectedArea = inTabs || inMovie;

    if (sessionExpired) {
      if (!inAuth) {
        router.replace("/(auth)/login");
      }
      clearSessionExpired();
      return;
    }

    if (accessToken) {
      if (!inProtectedArea && !inPasswordResetFlow) {
        router.replace("/(tabs)/home");
      }
      return;
    }

    if (inProtectedArea) {
      router.replace("/(splash)");
    }
  }, [isLoading, hydrated, accessToken, sessionExpired, clearSessionExpired, segments, router]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#101010] items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ToastProvider>
      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false }} />
        <OfflineNotice />
      </View>
    </ToastProvider>
  );
}
