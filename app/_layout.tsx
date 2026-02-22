import { useAuthStore } from "@/store/auth.store";
import { useSettingsStore } from "@/store/settings.store";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "../global.css";

export default function RootLayout() {
  const { hydrate, hydrated, accessToken } = useAuthStore();
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
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
    if (isLoading || !hydrated) return;

    const firstSegment = segments[0];
    const inTabs = firstSegment === "(tabs)";
    const inMovie = firstSegment === "movie";
    const inProtectedArea = inTabs || inMovie;

    if (accessToken) {
      if (!inTabs) {
        router.replace("/(tabs)/home");
      }
      return;
    }

    if (inProtectedArea) {
      router.replace("/(splash)");
    }
  }, [isLoading, hydrated, accessToken, segments, router]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
