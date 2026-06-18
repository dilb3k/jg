import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { apiClient } from "../src/api/client";
import * as secureStorage from "../src/utils/secureStorage";
import { BUSINESS_DAY_START_HOUR, STORAGE_KEYS } from "../src/constants";
import { useI18n } from "../src/i18n";
import { SPACING, FONT_SIZE, BORDER_RADIUS } from "../src/theme";
import { useStore } from "../src/store";
import { formatPhone, isCompletePhone, PHONE_PREFIX } from "../src/utils/phone";

const C = {
  bg: "#070512",
  bgMid: "#0F0A2E",
  bgDeep: "#0C0820",
  primary: "#7C3AED",
  accent: "#A78BFA",
  accentDim: "rgba(167,139,250,0.65)",
  white: "#FFFFFF",
  glass: "rgba(124,58,237,0.12)",
  glassB: "rgba(124,58,237,0.35)",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(167,139,250,0.15)",
  borderFocus: "#7C3AED",
  text: "rgba(255,255,255,0.9)",
  textSecondary: "rgba(167,139,250,0.65)",
  textTertiary: "rgba(167,139,250,0.3)",
  danger: "#EF4444",
  dangerBg: "rgba(239,68,68,0.1)",
  dangerBorder: "rgba(239,68,68,0.25)",
};

export default function LoginScreen() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(PHONE_PREFIX);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessDayHour, setBusinessDayHour] = useState(BUSINESS_DAY_START_HOUR);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { t } = useI18n();
  const setUser = useStore((state) => state.setUser);

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      setError(t("enterLoginPassword"));
      return;
    }

    if (!isLoginMode) {
      if (!isCompletePhone(phoneNumber)) {
        setError(t("enterPhonePassword"));
        return;
      }
      if (password !== confirmPassword) {
        setError(t("passwordsDoNotMatch"));
        return;
      }
      if (password.length < 6) {
        setError(t("passwordTooShort"));
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (isLoginMode) {
        result = await apiClient.login(username.trim(), password);
      } else {
        result = await apiClient.register(username.trim(), password, phoneNumber.trim(), businessDayHour);
      }

      await secureStorage.setItemAsync(STORAGE_KEYS.USER_TOKEN, result.token);
      apiClient.setToken(result.token);

        const normalizedUser = {
          ...result.user,
          businessDayStartHour:
            (result.user as any)?.businessDayStartHour || BUSINESS_DAY_START_HOUR,
          isPayed: (result.user as any)?.isPayed ?? false,
        };

        await secureStorage.setItemAsync(
          STORAGE_KEYS.AUTH_USER,
          JSON.stringify(normalizedUser),
        );

        setUser(normalizedUser);

        if (result.user?.role === "superAdmin") {
          router.replace("/(tabs)/users");
        } else {
          router.replace("/(tabs)");
        }
    } catch (err: any) {
      setError(err.message || (isLoginMode ? t("loginError") : t("registerError")));
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    {
      backgroundColor: C.surface,
      borderColor: focusedField === field ? C.borderFocus : C.border,
      color: C.text,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
    >
      <LinearGradient
        colors={[C.bg, C.bgMid, C.bgDeep, C.bg]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Image
            source={require("../assets/Hisvex.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.brandRow}>
            <Text style={styles.brandHis}>His</Text>
            <Text style={styles.brandVex}>vex</Text>
          </View>
          <Text style={styles.tagline}>
            {isLoginMode ? t("signInToSystem") : t("createAccount")}
          </Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              isLoginMode && { borderBottomColor: C.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => {
              setIsLoginMode(true);
              setError(null);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: isLoginMode ? C.primary : C.textTertiary },
                isLoginMode && { fontWeight: "700" },
              ]}
            >
              {t("signIn")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              !isLoginMode && { borderBottomColor: C.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => {
              setIsLoginMode(false);
              setError(null);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: !isLoginMode ? C.primary : C.textTertiary },
                !isLoginMode && { fontWeight: "700" },
              ]}
            >
              {t("signUp")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t("loginLabel")}</Text>
            <TextInput
              style={inputStyle("login")}
              placeholder={t("loginPlaceholder")}
              placeholderTextColor={C.textTertiary}
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocusedField("login")}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {!isLoginMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("authPhoneNumber")}</Text>
              <TextInput
                style={inputStyle("phone")}
                placeholder={t("phoneNumberPlaceholder")}
                placeholderTextColor={C.textTertiary}
                value={phoneNumber}
                onChangeText={(v) => setPhoneNumber(formatPhone(v))}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                keyboardType="phone-pad"
                maxLength={17}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t("password")}</Text>
            <TextInput
              style={inputStyle("password")}
              placeholder={t("passwordPlaceholder")}
              placeholderTextColor={C.textTertiary}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {!isLoginMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("confirmPassword")}</Text>
              <TextInput
                style={inputStyle("confirm")}
                placeholder={t("confirmPasswordPlaceholder")}
                placeholderTextColor={C.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField("confirm")}
                onBlur={() => setFocusedField(null)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {!isLoginMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("businessDayHour")}</Text>
              <Text style={styles.hourDesc}>{t("businessDayHourDesc")}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourRow}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.hourChip,
                      businessDayHour === i && styles.hourChipSelected,
                    ]}
                    onPress={() => setBusinessDayHour(i)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.hourChipText,
                        businessDayHour === i && styles.hourChipTextSelected,
                      ]}
                    >
                      {String(i).padStart(2, "0")}:00
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
            onPress={handleAuth}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <Text style={styles.submitText}>
                {isLoginMode ? t("signIn") : t("signUp")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isLoginMode ? t("noAccountSwitch") : t("haveAccountSwitch")}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsLoginMode(!isLoginMode);
              setError(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.footerLink}>
              {isLoginMode ? t("signUpHere") : t("signInHere")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 120,
    paddingBottom: SPACING.xl,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: -SPACING.xxl,
  },
  brandRow: {
    flexDirection: "row",
    marginBottom: SPACING.xs,
  },
  brandHis: {
    fontSize: 36,
    fontWeight: "800",
    color: C.primary,
    letterSpacing: -0.5,
  },
  brandVex: {
    fontSize: 36,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FONT_SIZE.sm,
    color: C.accentDim,
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: SPACING.lg,
    gap: SPACING.xl,
  },
  tab: {
    paddingBottom: SPACING.sm,
  },
  tabText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
  },
  form: {
    gap: SPACING.md,
  },
  errorBox: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    backgroundColor: C.dangerBg,
    borderColor: C.dangerBorder,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    textAlign: "center",
    fontWeight: "500",
    color: C.danger,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: C.textSecondary,
    marginLeft: 2,
  },
  input: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZE.md,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  hourDesc: {
    fontSize: FONT_SIZE.xs,
    color: C.textTertiary,
    marginLeft: 2,
    marginBottom: SPACING.xs,
  },
  hourRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  hourChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  hourChipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  hourChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: C.textSecondary,
  },
  hourChipTextSelected: {
    color: C.white,
  },
  submitButton: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    marginTop: SPACING.sm,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
  },
  submitText: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: C.white,
  },
  footer: {
    marginTop: SPACING.xxl,
    alignItems: "center",
    gap: SPACING.xs,
  },
  footerText: {
    fontSize: FONT_SIZE.sm,
    color: C.textTertiary,
    textAlign: "center",
  },
  footerLink: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: C.primary,
  },
});
