import { checkPhoneAvailability } from "@/services/auth.service";
import { sendOtp } from "@/services/otp.service";
import { useI18n } from "@/shared/i18n/useI18n";
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
  const { t } = useI18n();
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
      Alert.alert(t("common.errorTitle"), t("phone.errorMissingProfile"));
      return;
    }

    if (!isValid) {
      Alert.alert(
        t("common.errorTitle"),
        t("phone.errorInvalidFormat"),
      );
      return;
    }

    if (phoneStatus !== "available") {
      try {
        const exists = await checkPhoneAvailability(cleanPhone!);
        setPhoneStatus(exists ? "taken" : "available");
        if (exists) {
          Alert.alert(t("common.errorTitle"), t("phone.errorTaken"));
          return;
        }
      } catch {
        setPhoneStatus("error");
        Alert.alert(t("common.errorTitle"), t("phone.errorCheckFailed"));
        return;
      }
    }

    setLoading(true);
    try {
      await sendOtp(cleanPhone!);
      setPhone(cleanPhone!);
      router.push("/(auth)/otp");
    } catch {
      Alert.alert(t("common.errorTitle"), t("phone.errorSendOtp"));
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

        <Text className="text-gray-400 text-sm mb-6">{t("phone.step")}</Text>

        <Text className="text-white text-3xl font-semibold mb-2">{t("phone.title")}</Text>

        <Text className="text-gray-400 text-sm mb-6">{t("phone.subtitle")}</Text>

        <TextInput
          placeholder={t("phone.placeholder")}
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={displayPhone}
          onChangeText={handleChange}
          maxLength={17}
          className={inputClass}
          style={{ height: 56, paddingVertical: 0, textAlignVertical: "center" }}
        />
        {phoneStatus === "checking" ? (
          <Text className="text-xs text-gray-400 mt-2">{t("phone.checking")}</Text>
        ) : null}
        {phoneStatus === "available" ? (
          <Text className="text-xs text-green-400 mt-2">{t("phone.available")}</Text>
        ) : null}
        {phoneStatus === "taken" ? (
          <Text className="text-xs text-red-400 mt-2">{t("phone.taken")}</Text>
        ) : null}
        {phoneStatus === "invalid" ? (
          <Text className="text-xs text-red-400 mt-2">{t("phone.invalid")}</Text>
        ) : null}
        {phoneStatus === "error" ? (
          <Text className="text-xs text-red-400 mt-2">{t("phone.checkFailed")}</Text>
        ) : null}

        <Text className="text-xs text-gray-400 mt-4">
          {t("phone.agreementPrefix")}{" "}
          <Text className="text-blue-400">{t("phone.terms")}</Text> {t("phone.and")}{" "}
          <Text className="text-blue-400">{t("phone.privacy")}</Text>
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
            {t("phone.submit")}
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
