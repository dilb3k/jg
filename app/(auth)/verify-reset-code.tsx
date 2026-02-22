import { verifyForgotPasswordCode } from "@/services/otp.service";
import { BackIcon } from "@/shared/ui/icons/BackIcon";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function VerifyResetCode() {
  const router = useRouter();
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

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const borderClass = error ? "border-red-500" : "border-transparent";

  return (
    <View className="flex-1 bg-black px-6 pt-20 justify-between">
      <View>
        <Pressable onPress={() => router.back()} className="mb-4 self-start p-1">
          <BackIcon color="#D1D5DB" size={22} />
        </Pressable>

        <Text className="text-white text-3xl font-semibold mb-3">
          Введите код подтверждения
        </Text>

        <Text className="text-[#86868b] text-base mb-10">
          Введите код из SMS, отправленный на номер {resetPhone}
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
              maxLength={1}
              className={`bg-[#1c1c1e] text-white text-2xl text-center rounded-xl w-12 h-14 border-2 ${borderClass}`}
              style={{ paddingVertical: 0, textAlignVertical: "center" }}
            />
          ))}
        </View>

        <Text className="text-[#86868b] text-sm text-center mb-8">
          Отправить код повторно можно через {formatTimer(timer)}
        </Text>

        {error && (
          <Text className="text-red-500 text-center mb-4">
            Код неверный или истёк
          </Text>
        )}
      </View>

      <View className="mb-10">
        <Pressable
          onPress={submit}
          disabled={!isComplete || loading || !isTimerActive}
          className={`py-4 rounded-[14px] active:opacity-90 ${
            isComplete && isTimerActive && !loading
              ? "bg-white"
              : "bg-[#2c2c2e]"
          }`}
        >
          {loading ? (
            <Text className="text-center text-black font-semibold text-base">
              Проверяем...
            </Text>
          ) : (
            <Text
              className={`text-center font-semibold text-base ${
                isComplete && isTimerActive ? "text-black" : "text-white"
              }`}
            >
              Подтвердить
            </Text>
          )}
        </Pressable>

        {!isTimerActive && (
          <Text className="text-red-500 text-center mt-4 text-base font-medium">
            Время истекло. Пожалуйста, запросите новый код.
          </Text>
        )}
      </View>
    </View>
  );
}
