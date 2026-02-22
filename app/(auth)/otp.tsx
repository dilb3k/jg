import { registerUser } from "@/services/auth.service";
import { sendOtp } from "@/services/otp.service";
import { BackIcon } from "@/shared/ui/icons/BackIcon";
import { useAuthStore } from "@/store/auth.store";
import { getDeviceId } from "@/utils/device-id";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatBirthDate = (d: string) => {
  const [day, month, year] = d.split(".");
  return `${year}-${month}-${day}`;
};

export default function Otp() {
  const router = useRouter();
  const { phone, profileData, setAuth, clearRegistrationData } = useAuthStore();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [timer, setTimer] = useState(120);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const isOtpComplete = otp.every((digit) => digit !== "");

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (!phone || !profileData) {
      Alert.alert("Xatolik", "Ro'yxatdan o'tish ma'lumotlari topilmadi");
      router.replace("/(auth)/register");
    }
  }, [phone, profileData, router]);

  const handleChange = (text: string, index: number) => {
    if (!text) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      setError(false);
      return;
    }

    // Support iOS OTP autofill / paste (e.g. "123456")
    if (/^\d{2,6}$/.test(text)) {
      const digits = text.slice(0, 6).split("");
      const newOtp = [...otp];

      for (let i = 0; i < 6; i += 1) {
        newOtp[i] = digits[i] ?? "";
      }

      setOtp(newOtp);
      setError(false);
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }

    if (!/^\d$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError(false); // сбрасываем ошибку при вводе

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submit = async () => {
    if (!isOtpComplete || !phone || !profileData) {
      if (!phone || !profileData) {
        Alert.alert("Xatolik", "Ro'yxatdan o'tish ma'lumotlari topilmadi");
        router.replace("/(auth)/register");
      }
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const deviceId = await getDeviceId();
      const formattedBirthDate = formatBirthDate(profileData.birth_date);

      const payload = {
        phone,
        code: otp.join(""),
        username: profileData.username,
        password: profileData.password,
        full_name: profileData.full_name,
        birth_date: formattedBirthDate,
        device_type: "mobile",
        device_name: Device.modelName ?? "unknown",
        device_id: deviceId,
        notification_id: "", // TODO: заменить на реальный Expo Push Token
      };

      const res = await registerUser(payload);
      const { tokens, user } = res.data.data;

      await setAuth({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user,
      });
      clearRegistrationData();
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(true);
      const errorMsg = e.response?.data?.error?.message || "OTP noto'g'ri";
      const details = e.response?.data?.error?.details;

      if (details && Array.isArray(details)) {
        Alert.alert(
          "Xatolik",
          errorMsg +
            "\n\n" +
            details.map((d: any) => `• ${d.field}: ${d.message}`).join("\n"),
        );
      } else {
        Alert.alert("Xatolik", errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!phone || timer > 0) return;

    setLoading(true);
    try {
      await sendOtp(phone);
      setTimer(120);
      setOtp(["", "", "", "", "", ""]);
      setError(false);
      Alert.alert("Muvaffaqiyatli", "Kodni qayta yuborildi");
    } catch {
      Alert.alert("Xatolik", "Kodni yuborib bo‘lmadi");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const borderColor = error
    ? "border-red-500"
    : isOtpComplete
      ? "border-green-500"
      : "border-gray-700";

  return (
    <SafeAreaView className="flex-1 bg-black px-6 py-8 justify-between">
      <View>
        <Pressable onPress={() => router.back()} className="mb-4 self-start p-1">
          <BackIcon color="#D1D5DB" size={22} />
        </Pressable>

        <Text className="text-gray-400 text-sm mb-6">Sign up / OTP</Text>

        <Text className="text-white text-3xl font-semibold mb-2">
          Подтвердите номер телефона
        </Text>

        <Text className="text-gray-400 text-sm mb-6">Введите код из SMS</Text>

        <View className="flex-row justify-between mb-4">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => {(inputRefs.current[i] = r)}}
              value={digit}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              placeholder="•"
              placeholderTextColor="#666"
              className={`w-12 h-14 bg-[#1f1f1f] text-white text-center text-xl rounded-xl border-2 ${borderColor}`}
              style={{ paddingVertical: 0, textAlignVertical: "center" }}
            />
          ))}
        </View>

        <Pressable onPress={resendOtp} disabled={timer > 0 || loading}>
          <Text
            className={`text-xs text-center ${timer > 0 || loading ? "text-gray-500" : "text-blue-400"}`}
          >
            {timer > 0
              ? `Повторная отправка через ${formatTime(timer)}`
              : "Отправить код повторно"}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={submit}
        disabled={!isOtpComplete || loading}
        className={`rounded-2xl py-4 ${
          isOtpComplete && !loading ? "bg-white" : "bg-gray-700"
        }`}
      >
        {loading ? (
          <ActivityIndicator color={isOtpComplete ? "#000" : "#666"} />
        ) : (
          <Text
            className={`text-center text-lg font-semibold ${
              isOtpComplete ? "text-black" : "text-gray-400"
            }`}
          >
            Подтвердить
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
