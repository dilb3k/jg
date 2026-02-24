import { sendForgotPasswordOtp, verifyForgotPasswordCode } from "@/services/otp.service";
import { useI18n } from "@/shared/i18n/useI18n";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
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

export default function VerifyResetCode() {
  const router = useRouter();
  const { t } = useI18n();
  const { resetPhone, setResetData } = useAuthStore();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [timer, setTimer] = useState(48);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const isComplete = code.every((digit) => digit !== "");
  const isTimerActive = timer > 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (text: string, index: number) => {
    if (text && text.length > 1) return;
    if (text && !/^\d?$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    setError(false);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submit = async () => {
    if (!isComplete || !resetPhone || loading || !isTimerActive) return;

    setLoading(true);
    setError(false);

    try {
      const fullCode = code.join("");
      const res = await verifyForgotPasswordCode({
        phone: resetPhone,
        code: fullCode,
      });

      setResetData(resetPhone, res.data.data.reset_token);
      router.push("/(auth)/reset-password");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!resetPhone || isTimerActive || loading) return;
    try {
      setLoading(true);
      await sendForgotPasswordOtp(resetPhone);
      setTimer(48);
      setCode(["", "", "", "", "", ""]);
      setError(false);
      Alert.alert(t("common.successTitle"), t("otp.resendSuccess"));
    } catch {
      Alert.alert(t("common.errorTitle"), t("forgotPassword.errorSendCode"));
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const borderClass = error ? "border-red-500" : "border-transparent";

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
          <View>
            <Pressable onPress={() => router.back()} className="mb-4 self-start w-10 h-10 rounded-full bg-[#2C2C2C] items-center justify-center">
              <ChevronLeft size={20} color="#fff" />
            </Pressable>

            <Text className="text-white text-3xl font-semibold mb-3">
              {t("verifyReset.title")}
            </Text>

            <Text className="text-[#86868b] text-base mb-10">
              {t("verifyReset.subtitle", { phone: resetPhone ?? "" })}
            </Text>

            <View className="flex-row justify-between mb-6">
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {(inputRefs.current[index] = ref)}}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  textContentType={index === 0 ? "oneTimeCode" : "none"}
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  className={`bg-[#2C2C2C] text-white text-2xl text-center rounded-xl w-12 h-14 border-2 ${borderClass}`}
                  style={{ paddingVertical: 0, textAlignVertical: "center", includeFontPadding: false }}
                />
              ))}
            </View>

            <Text className="text-[#86868b] text-sm text-center mb-8">
              {t("verifyReset.resendIn", { time: formatTimer(timer) })}
            </Text>

            {error && (
              <Text className="text-red-500 text-center mb-4">
                {t("verifyReset.errorCodeInvalid")}
              </Text>
            )}
          </View>

          <View className="flex-1 min-h-8" />

          <View className="mb-4">
            <Pressable
              onPress={submit}
              disabled={!isComplete || loading || !isTimerActive}
              className={`py-4 rounded-[14px] active:opacity-90 ${
                isComplete && isTimerActive && !loading
                  ? "bg-white"
                  : "bg-[#2C2C2C]"
              }`}
            >
              {loading ? (
                <Text className="text-center text-black font-semibold text-base">
                  {t("verifyReset.loading")}
                </Text>
              ) : (
                <Text
                  className={`text-center font-semibold text-base ${
                    isComplete && isTimerActive ? "text-black" : "text-white"
                  }`}
                >
                  {t("verifyReset.submit")}
                </Text>
              )}
            </Pressable>

            {!isTimerActive && (
              <View className="mt-4">
                <Text className="text-red-500 text-center text-base font-medium">
                  {t("verifyReset.expired")}
                </Text>
                <Pressable onPress={resend} disabled={loading} className="mt-3">
                  <Text className="text-blue-400 text-center text-base font-medium">
                    {t("verifyReset.resend")}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
