import { useI18n } from "@/shared/i18n/useI18n";
import { AppLanguage, useSettingsStore } from "@/store/settings.store";
import { useRouter } from "expo-router";
import { Check, ChevronLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LanguageOption = {
  code: AppLanguage;
  label: string;
  flag: string;
};

export default function LanguageScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const options: LanguageOption[] = [
    { code: "ru", label: t("language.ru"), flag: "🇷🇺" },
    { code: "uz", label: t("language.uz"), flag: "🇺🇿" },
    { code: "en", label: t("language.en"), flag: "🇺🇸" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#101010]" edges={["top"]}>
      <View className="px-4 flex-row items-center pt-2 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full bg-[#2C2C2C] items-center justify-center"
        >
          <ChevronLeft size={20} color="#fff" />
        </Pressable>

        <Text className="text-white text-lg font-medium flex-1 text-center mr-11">
          {t("language.title")}
        </Text>
      </View>

      <View className="px-4 gap-2">
        {options.map((item) => {
          const active = item.code === language;
          return (
            <Pressable
              key={item.code}
              className="bg-[#1A1A1A] rounded-2xl py-1 px-1 pr-4 flex-row items-center"
              onPress={() => setLanguage(item.code)}
            >
              <Text className="text-2xl mr-3 bg-[#2C2C2C] p-4 rounded-2xl">{item.flag}</Text>
              <Text className="text-white text-lg flex-1">{item.label}</Text>
              {active ? <Check size={20} color="#fff" /> : null}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
