import { sendForgotPasswordOtp } from "@/services/otp.service";
import { useI18n } from "@/shared/i18n/useI18n";
import { useAuthStore } from "@/store/auth.store";
import { formatPhone } from "@/utils/format-phone";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useI18n();
  const setResetData = useAuthStore((s) => s.setResetData);
  const [phone, setPhone] = useState("+998");
  const [displayPhone, setDisplayPhone] = useState("+998");
  const [loading, setLoading] = useState(false);

  const handleChange = (text: string) => {
    const formatted = formatPhone(text);
    setDisplayPhone(formatted);
    setPhone(formatted.replace(/\s/g, ""));
  };

  const handleSubmit = async () => {
    if (phone.length !== 13) {
      Alert.alert(t("common.errorTitle"), t("forgotPassword.errorInvalidPhone"));
      return;
    }

    try {
      setLoading(true);
      await sendForgotPasswordOtp(phone);
      setResetData(phone, "");
      router.push("/(auth)/verify-reset-code");
    } catch {
      Alert.alert(t("common.errorTitle"), t("forgotPassword.errorSendCode"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6 pt-6"
        >
          <Pressable onPress={() => router.back()} className="mb-4 self-start w-10 h-10 rounded-full bg-[#2C2C2C] items-center justify-center">
            <ChevronLeft size={20} color="#fff" />
          </Pressable>

          <Text className="text-white text-3xl font-semibold mb-3">
            {t("forgotPassword.title")}
          </Text>

          <Text className="text-[#86868b] text-base mb-8">
            {t("forgotPassword.subtitle")}
          </Text>

          <Text className="text-white text-sm mb-2 ml-1">{t("forgotPassword.phoneLabel")}</Text>

          <TextInput
            value={displayPhone}
            onChangeText={handleChange}
            placeholder="+998"
            placeholderTextColor="#86868b"
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={17}
            className="bg-[#2C2C2C] text-white rounded-xl px-4 text-base h-14 mb-8"
            style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
          />

          <View className="flex-1 min-h-8" />

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="bg-white py-4 rounded-[14px] active:opacity-80 mb-4"
          >
            <Text className="text-center text-black font-semibold text-base">
              {loading ? t("common.loading") : t("forgotPassword.submit")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
