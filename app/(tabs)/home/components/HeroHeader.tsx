import { NotificationIcon } from "@/shared/ui/icons/NotificationIcon";
import { useAuthStore } from "@/store/auth.store";
import { useProfileStore } from "@/store/profile.store";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, TouchableOpacity, View } from "react-native";

export function HeroHeader() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const profile = useProfileStore((state) => state.profile);
  const status = useProfileStore((state) => state.status);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);

  useEffect(() => {
    if (!accessToken) return;
    if (status === "loading") return;
    if (profile) return;
    void fetchProfile();
  }, [accessToken, fetchProfile, profile, status]);

  return (
    <View className="h-16 px-4 flex-row justify-between items-center bg-transparent">
      <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/profile")}>
        <Image
          source={{
            uri:
              profile?.avatar_url ??
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuNhTZJTtkR6b-ADMhmzPvVwaLuLdz273wvQ&s",
          }}
          className="w-11 h-11 rounded-full border border-white/30"
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        className="w-10 h-10 rounded-full bg-black/35 items-center justify-center"
      >
        <NotificationIcon color="#F2F2F2" />
      </TouchableOpacity>
    </View>
  );
}
