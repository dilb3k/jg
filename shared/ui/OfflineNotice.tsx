import { useI18n } from "@/shared/i18n/useI18n";
import { useNetworkStore } from "@/store/network.store";
import { WifiOff } from "lucide-react-native";
import { Text, View } from "react-native";

export function OfflineNotice() {
  const { t } = useI18n();
  const isConnected = useNetworkStore((state) => state.isConnected);
  const hasChecked = useNetworkStore((state) => state.hasChecked);

  if (!hasChecked || isConnected) return null;

  return (
    <View className="absolute inset-0 z-[100] bg-black/90 items-center justify-center px-8">
      <WifiOff size={28} color="#A8ABB2" />
      <Text className="text-white text-lg mt-5 text-center">{t("network.offlineTitle")}</Text>
      <Text className="text-white/55 text-center mt-2">{t("network.offlineSubtitle")}</Text>
    </View>
  );
}
