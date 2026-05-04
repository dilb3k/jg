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
import { SPACING, FONT_SIZE, BORDER_RADIUS } from "../src/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Theme integration
  const { colors } = useTheme();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Login va parolni kiriting");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.login(username.trim(), password);
      
      // Save token
      await secureStorage.setItemAsync(STORAGE_KEYS.USER_TOKEN, result.token);
      apiClient.setToken(result.token);

      // Save user
      await secureStorage.setItemAsync(STORAGE_KEYS.AUTH_USER, JSON.stringify(result.user));

      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "Login xatoligi");
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
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.white }]}>B</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Barrel Management</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Tizimga kiring</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.danger + "15", borderColor: colors.danger + "40" }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Login</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Loginingizni kiriting"
              placeholderTextColor={colors.textTertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Parol</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Parolingizni kiriting"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[styles.loginButtonText, { color: colors.white }]}>Kirish</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {`Hisobingiz yo'qmi? Administratorga murojaat qiling`}
          </Text>
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
  },
  footerText: {
    fontSize: FONT_SIZE.sm,
    textAlign: "center",
  },
});