import { checkPhoneAvailability } from "@/services/auth.service";
import { sendOtp } from "@/services/otp.service";
import { BackIcon } from "@/shared/ui/icons/BackIcon";
import { useAuthStore } from "@/store/auth.store";
import { formatPhone } from "@/utils/format-phone";
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
  const [phoneStatus, setPhoneStatus] = useState<
    "idle" | "invalid" | "checking" | "available" | "taken" | "error"
  >("idle");
  const phoneCheckIdRef = useRef(0);

  const cleanPhone = getCleanPhone(displayPhone);
  const isValid = cleanPhone !== null && cleanPhone.length === 13;
  const phoneDigitsCount = displayPhone.replace(/\D/g, "").length;
  const hasTypedPhone = phoneDigitsCount > 3;
  const isPhoneFullyTyped = phoneDigitsCount === 12;

  useEffect(() => {
    if (!profileData) {
      router.replace("/(auth)/register");
      return;
    }
  }, [profileData, router]);

  useEffect(() => {
    if (!hasTypedPhone) {
      setPhoneStatus("idle");
      return;
    }

    if (!isPhoneFullyTyped) {
      setPhoneStatus("idle");
      return;
    }

    if (!isValid || !cleanPhone) {
      setPhoneStatus("invalid");
      return;
    }

    const checkId = phoneCheckIdRef.current + 1;
    phoneCheckIdRef.current = checkId;
    setPhoneStatus("checking");

    const timer = setTimeout(async () => {
      try {
        const exists = await checkPhoneAvailability(cleanPhone);
        if (phoneCheckIdRef.current !== checkId) return;
        setPhoneStatus(exists ? "taken" : "available");
      } catch {
        if (phoneCheckIdRef.current !== checkId) return;
        setPhoneStatus("error");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [cleanPhone, hasTypedPhone, isPhoneFullyTyped, isValid]);

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

    if (phoneStatus !== "available") {
      try {
        const exists = await checkPhoneAvailability(cleanPhone!);
        setPhoneStatus(exists ? "taken" : "available");
        if (exists) {
          Alert.alert("Xatolik", "Bu telefon raqam oldin ro'yxatdan o'tgan");
          return;
        }
      } catch {
        setPhoneStatus("error");
        Alert.alert("Xatolik", "Telefonni tekshirib bo'lmadi");
        return;
      }
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

  const inputClass = "bg-[#1f1f1f] text-white rounded-xl px-4 text-base";

  return (
    <SafeAreaView className="flex-1 bg-black px-6 py-8 justify-between">
      <View>
        <Pressable onPress={() => router.back()} className="mb-4 self-start p-1">
          <BackIcon color="#D1D5DB" size={22} />
        </Pressable>

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
          style={{ height: 56, paddingVertical: 0, textAlignVertical: "center" }}
        />
        {phoneStatus === "checking" ? (
          <Text className="text-xs text-gray-400 mt-2">Проверка номера...</Text>
        ) : null}
        {phoneStatus === "available" ? (
          <Text className="text-xs text-green-400 mt-2">Номер свободен</Text>
        ) : null}
        {phoneStatus === "taken" ? (
          <Text className="text-xs text-red-400 mt-2">Номер уже зарегистрирован</Text>
        ) : null}
        {phoneStatus === "invalid" ? (
          <Text className="text-xs text-red-400 mt-2">Неверный формат номера</Text>
        ) : null}
        {phoneStatus === "error" ? (
          <Text className="text-xs text-red-400 mt-2">Не удалось проверить номер</Text>
        ) : null}

        <Text className="text-xs text-gray-400 mt-4">
          Я принимаю{" "}
          <Text className="text-blue-400">Пользовательское соглашение</Text> и{" "}
          <Text className="text-blue-400">Политику конфиденциальности</Text>
        </Text>
      </View>

      <Pressable
        onPress={submit}
        disabled={!isValid || loading || phoneStatus !== "available"}
        className={`rounded-2xl py-4 ${
          isValid && !loading && phoneStatus === "available"
            ? "bg-white"
            : "bg-gray-700"
        }`}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text
            className={`text-center text-lg font-semibold ${
              isValid && phoneStatus === "available" ? "text-black" : "text-gray-400"
            }`}
          >
            Отправить код
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
