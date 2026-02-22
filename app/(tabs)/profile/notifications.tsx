import { useI18n } from "@/shared/i18n/useI18n";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#07090D]" edges={["top"]}>
      <View className="px-4 flex-row items-center pt-2 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full bg-white/10 items-center justify-center"
        >
          <ChevronLeft size={20} color="#fff" />
        </Pressable>

        <Text className="text-white text-lg font-medium flex-1 text-center mr-11">
          {t("notifications.title")}
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white/60 text-base text-center">{t("notifications.empty")}</Text>
      </View>
    </SafeAreaView>
  );
}
