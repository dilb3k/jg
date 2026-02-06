import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Profile {
  avatar_url?: string;
  full_name: string;
  phone: string;
  birth_date?: string;
  gender?: string;
  language?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v1/auth/me");

      if (res.data?.success) {
        setProfile(res.data.data);
      }
    } catch (e: any) {
      if (e?.response?.status === 401) {
        await logout();
        router.replace("/(auth)/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/v1/auth/logout", { all_devices: false });
    } catch {}
    await logout();
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <ScrollView className="flex-1 bg-[#101010] px-4 pt-14">
      {/* AVATAR */}
      <View className="items-center mb-6">
        <Image
          source={{
            uri: profile.avatar_url ?? "https://via.placeholder.com/150",
          }}
          className="w-28 h-28 rounded-full mb-4"
        />
        <Text className="text-white text-xl font-semibold">
          {profile.full_name}
        </Text>
        <Text className="text-white/60 mt-1">{profile.phone}</Text>
      </View>

      {/* INFO */}
      <View className="bg-white/5 rounded-xl p-4 mb-6">
        <Text className="text-white/70 mb-2">
          Tug‘ilgan sana: {profile.birth_date ?? "—"}
        </Text>
        <Text className="text-white/70 mb-2">
          Jinsi: {profile.gender ?? "—"}
        </Text>
        <Text className="text-white/70">
          Til: {profile.language?.toUpperCase()}
        </Text>
      </View>

      {/* ACTIONS */}
      <TouchableOpacity
        className="bg-red-600 py-4 rounded-xl"
        activeOpacity={0.8}
        onPress={handleLogout}
      >
        <Text className="text-white text-center font-semibold">Chiqish</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
