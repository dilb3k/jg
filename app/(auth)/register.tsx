import { checkUsernameAvailability } from "@/services/auth.service";
import { useI18n } from "@/shared/i18n/useI18n";
import { useAuthStore } from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const pad = (value: number) => value.toString().padStart(2, "0");
const formatBirthDate = (date: Date) =>
  `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

export default function Register() {
  const router = useRouter();
  const { t } = useI18n();
  const { setProfileData } = useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(2000);
  const [pickerMonth, setPickerMonth] = useState(1);
  const [pickerDay, setPickerDay] = useState(1);

  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "invalid" | "checking" | "available" | "taken" | "error"
  >("idle");
  const usernameCheckIdRef = useRef(0);

  const inputClass = "bg-[#2C2C2C] text-white rounded-xl px-4 text-base h-14";
  const usernameNormalized = useMemo(() => username.trim().toLowerCase(), [username]);
  const isUsernameFormatValid = useMemo(
    () => /^[a-zA-Z0-9_]{3,32}$/.test(usernameNormalized),
    [usernameNormalized],
  );
  const isBirthDateValid = useMemo(() => /^\d{2}\.\d{2}\.\d{4}$/.test(birthDate), [birthDate]);
  const isPasswordValid = useMemo(
    () => password.length >= 6 && password === confirmPassword,
    [confirmPassword, password],
  );
  const isNameValid = useMemo(
    () => firstName.trim().length > 0 && lastName.trim().length > 0,
    [firstName, lastName],
  );

  const canSubmit =
    isNameValid &&
    isUsernameFormatValid &&
    isBirthDateValid &&
    isPasswordValid &&
    usernameStatus !== "taken";

  const maxDay = useMemo(() => daysInMonth(pickerYear, pickerMonth), [pickerMonth, pickerYear]);

  useEffect(() => {
    if (pickerDay > maxDay) {
      setPickerDay(maxDay);
    }
  }, [maxDay, pickerDay]);

  useEffect(() => {
    if (!usernameNormalized) {
      setUsernameStatus("idle");
      return;
    }

    if (!isUsernameFormatValid) {
      setUsernameStatus("invalid");
      return;
    }

    const checkId = usernameCheckIdRef.current + 1;
    usernameCheckIdRef.current = checkId;
    setUsernameStatus("checking");

    const timer = setTimeout(async () => {
      try {
        const exists = await checkUsernameAvailability(usernameNormalized);
        if (usernameCheckIdRef.current !== checkId) return;
        setUsernameStatus(exists ? "taken" : "available");
      } catch {
        if (usernameCheckIdRef.current !== checkId) return;
        setUsernameStatus("error");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isUsernameFormatValid, usernameNormalized]);

  const ensureUsernameAvailable = async () => {
    try {
      const exists = await checkUsernameAvailability(usernameNormalized);
      setUsernameStatus(exists ? "taken" : "available");
      return !exists;
    } catch {
      setUsernameStatus("error");
      return false;
    }
  };

  const openDatePicker = () => {
    const now = new Date();
    let initial = new Date(now.getFullYear() - 18, 0, 1);

    if (isBirthDateValid) {
      const [dd, mm, yyyy] = birthDate.split(".").map((v) => Number(v));
      initial = new Date(yyyy, mm - 1, dd);
    }

    setPickerYear(initial.getFullYear());
    setPickerMonth(initial.getMonth() + 1);
    setPickerDay(initial.getDate());
    setShowDatePicker(true);
  };

  const applyDate = () => {
    const selected = new Date(pickerYear, pickerMonth - 1, pickerDay);
    setBirthDate(formatBirthDate(selected));
    setShowDatePicker(false);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(splash)");
  };

  const submit = async () => {
    const trimmed = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim().toLowerCase(),
    };

    if (!trimmed.firstName || !trimmed.lastName) {
      Alert.alert(t("common.errorTitle"), t("register.errorRequiredName"));
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,32}$/.test(trimmed.username)) {
      Alert.alert(t("common.errorTitle"), t("register.errorUsernameInvalid"));
      return;
    }

    if (usernameStatus !== "available") {
      const isAvailable = await ensureUsernameAvailable();
      if (!isAvailable) {
        Alert.alert(t("common.errorTitle"), t("register.errorUsernameTaken"));
        return;
      }
    }

    if (!isBirthDateValid) {
      Alert.alert(t("common.errorTitle"), t("register.errorBirthDate"));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t("common.errorTitle"), t("register.errorPasswordMin"));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("common.errorTitle"), t("register.errorPasswordMismatch"));
      return;
    }

    setProfileData({
      full_name: `${trimmed.firstName} ${trimmed.lastName}`,
      username: trimmed.username,
      birth_date: birthDate,
      password,
    });

    router.push("/(auth)/phone");
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        className="px-6"
        contentContainerStyle={{ paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={handleBack} className="mb-4 self-start w-10 h-10 rounded-full bg-[#2C2C2C] items-center justify-center">
          <ChevronLeft size={20} color="#fff" />
        </Pressable>

        <Text className="text-gray-400 text-sm mb-2">{t("register.step")}</Text>

        <Text className="text-white text-3xl font-semibold mb-1">{t("register.title")}</Text>

        <Text className="text-gray-400 text-sm mb-8">{t("register.subtitle")}</Text>

        <Text className="text-gray-400 text-sm mb-2">{t("register.firstName")}</Text>
        <TextInput
          placeholder={t("register.firstNamePlaceholder")}
          placeholderTextColor="#666"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          className={inputClass}
          style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
        />

        <Text className="text-gray-400 text-sm mb-2 mt-4">{t("register.lastName")}</Text>
        <TextInput
          placeholder={t("register.lastNamePlaceholder")}
          placeholderTextColor="#666"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          className={inputClass}
          style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
        />

        <Text className="text-gray-400 text-sm mb-2 mt-4">{t("register.username")}</Text>
        <TextInput
          placeholder={t("register.usernamePlaceholder")}
          placeholderTextColor="#666"
          value={username}
          onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
          autoCapitalize="none"
          className={inputClass}
          style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
        />
        {usernameStatus === "checking" ? (
          <Text className="text-xs text-gray-400 mt-2">{t("register.usernameChecking")}</Text>
        ) : null}
        {usernameStatus === "available" ? (
          <Text className="text-xs text-green-400 mt-2">{t("register.usernameAvailable")}</Text>
        ) : null}
        {usernameStatus === "taken" ? (
          <Text className="text-xs text-red-400 mt-2">{t("register.usernameTaken")}</Text>
        ) : null}
        {usernameStatus === "invalid" ? (
          <Text className="text-xs text-red-400 mt-2">{t("register.usernameInvalid")}</Text>
        ) : null}
        {usernameStatus === "error" ? (
          <Text className="text-xs text-red-400 mt-2">{t("register.usernameCheckFailed")}</Text>
        ) : null}

        <Text className="text-gray-400 text-sm mb-2 mt-4">{t("register.birthDate")}</Text>
        <Pressable
          onPress={openDatePicker}
          className="bg-[#2C2C2C] rounded-xl px-4 flex-row items-center"
          style={{ height: 56 }}
        >
          <Text className={`flex-1 text-base ${birthDate ? "text-white" : "text-[#666]"}`}>
            {birthDate || t("register.birthDatePlaceholder")}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </Pressable>

        <Text className="text-gray-400 text-sm mb-2 mt-4">{t("register.password")}</Text>
        <TextInput
          placeholder={t("register.passwordPlaceholder")}
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          className={inputClass}
          style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
        />

        <Text className="text-gray-400 text-sm mb-2 mt-4">{t("register.confirmPassword")}</Text>
        <TextInput
          placeholder={t("register.confirmPasswordPlaceholder")}
          placeholderTextColor="#666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          className={inputClass}
          style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
        />

        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          className={`rounded-2xl py-4 mt-8 ${canSubmit ? "bg-white" : "bg-[#2C2C2C]"}`}
        >
          <Text className={`text-center text-lg font-semibold ${canSubmit ? "text-black" : "text-gray-300"}`}>
            {t("register.submit")}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/(auth)/login")} className="py-3 items-center mt-1">
          <Text className="text-gray-400 text-sm">
            {t("register.haveAccount")}{" "}
            <Text className="text-blue-400 font-medium">{t("login.submit")}</Text>
          </Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View className="flex-1 bg-black/70 items-center justify-center px-5">
          <View className="w-full bg-[#1c1c1e] rounded-2xl p-4">
            <Text className="text-white text-lg font-semibold text-center mb-4">{t("register.datePickerTitle")}</Text>

            <View className="flex-row gap-3 mb-5">
              <View className="flex-1 bg-[#2b2b2e] rounded-xl p-3 items-center">
                <Text className="text-white/70 text-xs mb-2">{t("register.day")}</Text>
                <Pressable onPress={() => setPickerDay((v) => Math.max(1, v - 1))}>
                  <Ionicons name="chevron-up" size={22} color="#fff" />
                </Pressable>
                <Text className="text-white text-2xl font-semibold my-1">{pad(pickerDay)}</Text>
                <Pressable onPress={() => setPickerDay((v) => Math.min(maxDay, v + 1))}>
                  <Ionicons name="chevron-down" size={22} color="#fff" />
                </Pressable>
              </View>

              <View className="flex-1 bg-[#2b2b2e] rounded-xl p-3 items-center">
                <Text className="text-white/70 text-xs mb-2">{t("register.month")}</Text>
                <Pressable onPress={() => setPickerMonth((v) => Math.max(1, v - 1))}>
                  <Ionicons name="chevron-up" size={22} color="#fff" />
                </Pressable>
                <Text className="text-white text-2xl font-semibold my-1">{pad(pickerMonth)}</Text>
                <Pressable onPress={() => setPickerMonth((v) => Math.min(12, v + 1))}>
                  <Ionicons name="chevron-down" size={22} color="#fff" />
                </Pressable>
              </View>

              <View className="flex-1 bg-[#2b2b2e] rounded-xl p-3 items-center">
                <Text className="text-white/70 text-xs mb-2">{t("register.year")}</Text>
                <Pressable onPress={() => setPickerYear((v) => Math.max(1900, v - 1))}>
                  <Ionicons name="chevron-up" size={22} color="#fff" />
                </Pressable>
                <Text className="text-white text-2xl font-semibold my-1">{pickerYear}</Text>
                <Pressable
                  onPress={() =>
                    setPickerYear((v) => Math.min(new Date().getFullYear() - 13, v + 1))
                  }
                >
                  <Ionicons name="chevron-down" size={22} color="#fff" />
                </Pressable>
              </View>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowDatePicker(false)}
                className="flex-1 bg-[#2C2C2C] py-3 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">{t("common.cancel")}</Text>
              </Pressable>
              <Pressable onPress={applyDate} className="flex-1 bg-white py-3 rounded-xl">
                <Text className="text-black text-center font-semibold">{t("register.done")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
