import { loginUser } from "@/services/auth.service";
import { useI18n } from "@/shared/i18n/useI18n";
import { useAuthStore } from "@/store/auth.store";
import { getDeviceId } from "@/utils/device-id";
import { formatPhone } from "@/utils/format-phone";
import { Feather } from "@expo/vector-icons";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
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

export default function Login() {
  const router = useRouter();
  const { t } = useI18n();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [loginType, setLoginType] = useState<"phone" | "username">("phone");
  const [phone, setPhone] = useState("+998");
  const [displayPhone, setDisplayPhone] = useState("+998");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPhoneLoginValid = phone.length === 13 && password.length > 0;
  const isUsernameLoginValid = username.trim().length >= 3 && password.length > 0;
  const canSubmit = loginType === "phone" ? isPhoneLoginValid : isUsernameLoginValid;

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setDisplayPhone(formatted);
    setPhone(formatted.replace(/\s/g, ""));
  };

  const submit = async () => {
    if (loginType === "phone" && (!phone || phone === "+" || !password)) return;
    if (loginType === "username" && (!username || !password)) return;

    try {
      setLoading(true);

      const deviceId = await getDeviceId();

      const payload = {
        login_type: loginType,
        ...(loginType === "phone" ? { phone } : { username }),
        password,
        device_id: deviceId,
        device_type: "mobile",
        device_name: Device.modelName ?? "unknown",
        notification_id: "",
      };

      const res = await loginUser(payload);
      const { tokens, user } = res.data.data;

      await setAuth({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user,
      });

      router.replace("/(tabs)/home");
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || t("login.errorDefault");
      Alert.alert(t("login.errorTitle"), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#101010]" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6 pt-6"
        >
          <Text className="text-white text-2xl font-semibold mb-2 mt-4">
            {t("login.title")}
          </Text>
          <Text className="text-gray-400 text-sm mb-8">
            {t("login.subtitle")}
          </Text>

          <View className="bg-[#2c2c2e] rounded-full p-1 flex-row mb-6">
            <Pressable
              onPress={() => setLoginType("phone")}
              className={`flex-1 py-3 rounded-full ${loginType === "phone" ? "bg-black" : ""}`}
            >
              <Text
                className={`text-center text-sm font-medium ${loginType === "phone" ? "text-white" : "text-gray-400"}`}
              >
                {t("login.phoneTab")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setLoginType("username")}
              className={`flex-1 py-3 rounded-full ${loginType === "username" ? "bg-black" : ""}`}
            >
              <Text
                className={`text-center text-sm font-medium ${loginType === "username" ? "text-white" : "text-gray-400"}`}
              >
                {t("login.usernameTab")}
              </Text>
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className="text-white text-sm mb-2">
              {loginType === "phone" ? t("login.phoneLabel") : t("login.usernameLabel")}
            </Text>
            {loginType === "phone" ? (
              <TextInput
                value={displayPhone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoComplete="tel"
                placeholder="+"
                placeholderTextColor="#666"
                className="bg-[#2C2C2C] text-white rounded-xl px-4 h-14"
                style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
              />
            ) : (
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder={t("login.usernamePlaceholder")}
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoComplete="username"
                className="bg-[#2C2C2C] text-white rounded-xl px-4 h-14"
                style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
              />
            )}
          </View>

          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-sm">{t("login.password")}</Text>
              <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                <Text className="text-blue-500 text-sm">{t("login.forgotPassword")}</Text>
              </Pressable>
            </View>

            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t("login.passwordPlaceholder")}
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                className="bg-[#2C2C2C] text-white rounded-xl px-4 pr-12 h-14"
                style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
              />

              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#888"
                />
              </Pressable>
            </View>
          </View>

          <View className="flex-1 min-h-8" />

          <Pressable
            onPress={submit}
            disabled={loading || !canSubmit}
            className={`py-4 rounded-2xl mb-4 ${
              loading || !canSubmit ? "bg-[#2C2C2C]" : "bg-white"
            }`}
          >
            <Text
              className={`text-center font-semibold text-base ${
                loading || !canSubmit ? "text-gray-300" : "text-black"
              }`}
            >
              {loading ? t("common.loading") : t("login.submit")}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/register")} className="py-3 items-center">
            <Text className="text-gray-400 text-sm">
              {t("login.noAccount")}{" "}
              <Text className="text-blue-400 font-medium">{t("login.register")}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
