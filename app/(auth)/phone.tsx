import { sendOtp } from "@/services/otp.service";
import { useAuthStore } from "@/store/auth.store";
import { formatPhone } from "@/utils/format-phone";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getCleanPhone = (display: string) => {
  const digits = display.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+${digits}`;
  }
  return null;
};

export default function Phone() {
  const router = useRouter();
  const { setPhone, profileData } = useAuthStore();

  const [displayPhone, setDisplayPhone] = useState("+998");
  const [loading, setLoading] = useState(false);

  const cleanPhone = getCleanPhone(displayPhone);
  const isValid = cleanPhone !== null && cleanPhone.length === 13;

  const handleChange = (text: string) => {
    const formatted = formatPhone(text);
    setDisplayPhone(formatted);
  };

  const submit = async () => {
    if (!profileData) {
      Alert.alert("Xatolik", "Profil to'ldirilmagan");
      return;
    }

    if (!isValid) {
      Alert.alert(
        "Xatolik",
        "Telefon +998 XX XXX XX XX formatda bo'lishi kerak",
      );
      return;
    }

    setLoading(true);
    try {
      await sendOtp(cleanPhone!);
      setPhone(cleanPhone!);
      router.push("/(auth)/otp");
    } catch {
      Alert.alert("Xatolik", "OTP yuborilmadi");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "bg-[#1f1f1f] text-white rounded-xl px-4 py-4 text-base";

  return (
    <SafeAreaView className="flex-1 bg-black px-6 py-8 justify-between">
      <View>
        <Text className="text-gray-400 text-sm mb-6">
          Sign up / Phone number
        </Text>

        <Text className="text-white text-3xl font-semibold mb-2">
          Введите номер телефона
        </Text>

        <Text className="text-gray-400 text-sm mb-6">
          Введите свой номер, чтобы продолжить регистрацию
        </Text>

        <TextInput
          placeholder="+998 00 000 00 00"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          value={displayPhone}
          onChangeText={handleChange}
          maxLength={17}
          className={inputClass}
        />

        <Text className="text-xs text-gray-400 mt-4">
          Я принимаю{" "}
          <Text className="text-blue-400">Пользовательское соглашение</Text> и{" "}
          <Text className="text-blue-400">Политику конфиденциальности</Text>
        </Text>
      </View>

      <Pressable
        onPress={submit}
        disabled={!isValid || loading}
        className={`rounded-2xl py-4 ${
          isValid && !loading ? "bg-white" : "bg-gray-700"
        }`}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text
            className={`text-center text-lg font-semibold ${
              isValid ? "text-black" : "text-gray-400"
            }`}
          >
            Отправить код
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
