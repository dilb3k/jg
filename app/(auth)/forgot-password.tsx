import { sendForgotPasswordOtp } from "@/services/otp.service";
import { useAuthStore } from "@/store/auth.store";
import { formatPhone } from "@/utils/format-phone";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function ForgotPassword() {
  const router = useRouter();
  const setResetData = useAuthStore((s) => s.setResetData);
  const [phone, setPhone] = useState("+998");
  const [displayPhone, setDisplayPhone] = useState("+998");

  const handleChange = (text: string) => {
    const formatted = formatPhone(text);
    setDisplayPhone(formatted);
    setPhone(formatted.replace(/\s/g, ""));
  };

  const handleSubmit = async () => {
    if (phone.length !== 13) return;
    await sendForgotPasswordOtp(phone);
    setResetData(phone, "");
    router.push("/(auth)/verify-reset-code");
  };

  return (
    <View className="flex-1 bg-black px-6 pt-20">
      <Text className="text-white text-3xl font-semibold mb-3">
        Восстановление пароля
      </Text>

      <Text className="text-[#86868b] text-base mb-8">
        Введите номер телефона, чтобы получить код для восстановления
      </Text>

      <Text className="text-white text-sm mb-2 ml-1">Номер телефона</Text>

      <TextInput
        value={displayPhone}
        onChangeText={handleChange}
        placeholder="+998"
        placeholderTextColor="#86868b"
        keyboardType="phone-pad"
        maxLength={17}
        className="bg-[#1c1c1e] text-white rounded-xl px-4 py-4 text-base mb-8"
      />

      <Pressable
        onPress={handleSubmit}
        className="bg-white py-4 rounded-[14px] active:opacity-80"
      >
        <Text className="text-center text-black font-semibold text-base">
          Отправить код
        </Text>
      </Pressable>
    </View>
  );
}
