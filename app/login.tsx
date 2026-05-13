import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { apiClient } from "../src/api/client";
import * as secureStorage from "../src/utils/secureStorage";
import { STORAGE_KEYS } from "../src/constants";
import { useTheme } from "../src/store/themeStore";
import { useI18n } from "../src/i18n";
import { SPACING, FONT_SIZE, BORDER_RADIUS } from "../src/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { colors } = useTheme();
  const { t } = useI18n();

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      setError(t("enterLoginPassword"));
      return;
    }

    if (!isLoginMode) {
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
        result = await apiClient.register(username.trim(), password);
      }

      await secureStorage.setItemAsync(STORAGE_KEYS.USER_TOKEN, result.token);
      apiClient.setToken(result.token);

      await secureStorage.setItemAsync(
        STORAGE_KEYS.AUTH_USER,
        JSON.stringify(result.user),
      );

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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.logoContainer}>
          <View
            style={[styles.logoCircle, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.logoText, { color: colors.white }]}>B</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("barrelManagement")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isLoginMode ? t("signInToSystem") : t("createAccount")}
          </Text>
        </View>

        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              isLoginMode && [styles.modeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
              { borderColor: colors.border },
            ]}
            onPress={() => {
              setIsLoginMode(true);
              setError(null);
            }}
          >
            <Text
              style={[
                styles.modeButtonText,
                isLoginMode && { color: colors.white, fontWeight: "700" },
                { color: isLoginMode ? colors.white : colors.text },
              ]}
            >
              {t("signIn")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              !isLoginMode && [styles.modeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
              { borderColor: colors.border },
            ]}
            onPress={() => {
              setIsLoginMode(false);
              setError(null);
            }}
          >
            <Text
              style={[
                styles.modeButtonText,
                !isLoginMode && { color: colors.white, fontWeight: "700" },
                { color: !isLoginMode ? colors.white : colors.text },
              ]}
            >
              {t("signUp")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {error ? (
            <View
              style={[
                styles.errorContainer,
                {
                  backgroundColor: colors.danger + "15",
                  borderColor: colors.danger + "40",
                },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t("username")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t("loginPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t("password")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t("passwordPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {!isLoginMode && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t("confirmPassword")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder={t("confirmPasswordPlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: colors.primary },
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleAuth}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[styles.loginButtonText, { color: colors.white }]}>
                {isLoginMode ? t("signIn") : t("signUp")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {isLoginMode ? t("noAccountSwitch") : t("haveAccountSwitch")}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsLoginMode(!isLoginMode);
              setError(null);
            }}
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
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
    justifyContent: "center",
    padding: SPACING.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING.xxxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  logoText: {
    fontSize: FONT_SIZE.title,
    fontWeight: "700",
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
  },
  modeSwitch: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
  },
  modeButtonActive: {
    borderWidth: 1,
  },
  modeButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
  },
  form: {
    gap: SPACING.md,
  },
  errorContainer: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    textAlign: "center",
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
  },
  input: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZE.md,
    borderWidth: 1,
  },
  loginButton: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: "center",
    gap: SPACING.xs,
  },
  footerText: {
    fontSize: FONT_SIZE.sm,
    textAlign: "center",
  },
  footerLink: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
});
