import { useI18n } from "@/shared/i18n/useI18n";
import { Text, View, useWindowDimensions } from "react-native";

const EmptyMessage = () => {
  const { height } = useWindowDimensions();
  const { t } = useI18n();

  return (
    <View
      style={{
        height,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#101010",
      }}
    >
      <Text className="text-white text-xl mb-2">{t("reels.emptyTitle")}</Text>
      <Text className="text-white/80 text-base w-2/3 text-center">
        {t("reels.emptySubtitle")}
      </Text>
    </View>
  );
};

export default EmptyMessage;
