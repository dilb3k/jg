import { NotificationIcon } from "@/shared/ui/icons/NotificationIcon";
import { useRouter } from "expo-router";
import { Image, TouchableOpacity, View } from "react-native";

export function HeroHeader() {
  const router = useRouter();

  return (
    <View className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-4 pt-14 z-10">
      {/* PROFILE */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push("/profile")}
      >
        <Image
          source={{
            uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuNhTZJTtkR6b-ADMhmzPvVwaLuLdz273wvQ&s",
          }}
          className="w-12 h-12 rounded-full border-2 border-white/20"
        />
      </TouchableOpacity>

      {/* RIGHT ICON */}
      <NotificationIcon color="#e6e6e6" />
    </View>
  );
}
