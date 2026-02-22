import { useI18n } from "@/shared/i18n/useI18n";
import { Text, View } from "react-native";

export default function SearchScreen() {
  const { t } = useI18n();

  return (
    <View className="flex-1 bg-[#101010] items-center justify-center">
      <Text className="text-white/70 text-base">{t("tabs.search")}</Text>
    </View>
  );
}
