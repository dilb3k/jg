import { resetPasswordRequest } from "@/services/otp.service";
import { useI18n } from "@/shared/i18n/useI18n";
import { useAuthStore } from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPassword() {
  const router = useRouter();
  const { t } = useI18n();
  const { resetToken, clearResetData } = useAuthStore();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (password.length < 6) {
      setError(t("resetPassword.errorMin"));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t("resetPassword.errorMismatch"));
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!resetToken || !validate()) return;

    try {
      await resetPasswordRequest({
        reset_token: resetToken,
        new_password: password,
      });
      clearResetData();
      router.replace("/(auth)/login");
    } catch {
      setError(t("resetPassword.errorDefault"));
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
            {t("resetPassword.title")}
          </Text>

          <Text className="text-[#86868b] text-base mb-10">
            {t("resetPassword.subtitle")}
          </Text>

          <Text className="text-white text-sm mb-2 ml-1">{t("resetPassword.newPassword")}</Text>

          <View className="relative mb-6">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t("resetPassword.newPasswordPlaceholder")}
              placeholderTextColor="#86868b"
              secureTextEntry={!showPassword}
              autoCorrect={false}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              className="bg-[#2C2C2C] text-white rounded-xl px-4 pr-12 text-base h-14"
              style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4"
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#86868b"
              />
            </Pressable>
          </View>

          <Text className="text-white text-sm mb-2 ml-1">
            {t("resetPassword.confirmPassword")}
          </Text>

          <View className="relative mb-6">
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t("resetPassword.confirmPasswordPlaceholder")}
              placeholderTextColor="#86868b"
              secureTextEntry={!showConfirmPassword}
              autoCorrect={false}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              className="bg-[#2C2C2C] text-white rounded-xl px-4 pr-12 text-base h-14"
              style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-4"
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#86868b"
              />
            </Pressable>
          </View>

          {error ? (
            <Text className="text-red-500 text-sm mb-4 text-center">{error}</Text>
          ) : null}

          <View className="flex-1 min-h-8" />

          <Pressable
            onPress={handleSubmit}
            className="bg-white py-4 rounded-[14px] active:opacity-80 mb-4"
          >
            <Text className="text-center text-black font-semibold text-base">
              {t("resetPassword.submit")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
