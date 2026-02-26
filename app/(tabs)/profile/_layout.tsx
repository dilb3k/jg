import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="language" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="saved" />
      <Stack.Screen name="tv-link" />
      <Stack.Screen name="tv-link-scan" />
      <Stack.Screen name="tv-link-code" />
    </Stack>
  );
}
