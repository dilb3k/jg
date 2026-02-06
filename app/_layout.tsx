import { useAuthStore } from "@/store/auth.store";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "../global.css";

export default function RootLayout() {
  const {
    hydrate,
    hydrated,
    accessToken,
    phone,
    profileData,
    clearRegistrationData,
  } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        await hydrate();
      } catch (error) {
        console.error("Auth hydration error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && hydrated) {
      if (accessToken) {
        router.replace("/(tabs)/home");
      } else {
        if (phone || profileData) {
          clearRegistrationData();
        }
        router.replace("/(splash)");
      }
    }
  }, [
    isLoading,
    hydrated,
    accessToken,
    phone,
    profileData,
    router,
    clearRegistrationData,
  ]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
