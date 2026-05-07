import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { SPACING, FONT_SIZE, BORDER_RADIUS, type ThemeColors } from "../../src/theme";
import { useAuthStore } from "../../src/store/selectors";
import { useStore } from "../../src/store";
import { apiClient } from "../../src/api/client";
import type { AuthUser } from "../../src/types";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";

export default function AdminsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { showToast } = useStore();
  const [admins, setAdmins] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Only superAdmin can access this page
    if (user?.role !== "superAdmin") {
      router.replace("/(tabs)");
      return;
    }
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAdmins();
      setAdmins(data);
    } catch (err: any) {
      setError(err.message || t("errorLoadingAdmins"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!username.trim() || !password.trim()) {
      setError(t("enterLoginPassword"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordLength"));
      return;
    }

      setIsCreating(true);
      setError(null);

      try {
        await apiClient.createAdmin(username.trim(), password);
        setShowModal(false);
        setUsername("");
        setPassword("");
        loadAdmins();
        showToast(t("userCreated"), "success");
      } catch (err: any) {
        setError(err.message || t("createUserError"));
      } finally {
        setIsCreating(false);
      }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superAdmin":
        return t("superAdmin");
      case "admin":
        return t("admin");
      default:
        return role;
    }
  };

  if (user?.role !== "superAdmin") {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("usersTitle")}</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.logoutButtonText}>{t("logout")}</Text>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t("loading")}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={admins}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.adminCard}>
                <View style={styles.adminInfo}>
                  <Text style={styles.adminName}>{item.username}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{getRoleLabel(item.role)}</Text>
                  </View>
                  <Text style={styles.adminDate}>
                    {t("createdAt")}: {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.list}
          />

          <View style={styles.footer}>
            <Pressable
              style={styles.addButton}
              onPressOut={() => {
                setShowModal(true);
                setError(null);
                setUsername("");
                setPassword("");
              }}
            >
              <Text style={styles.addButtonText}>+ {t("createUser")}</Text>
            </Pressable>
          </View>
        </>
      )}

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
             <View style={styles.modalHeader}>
               <TouchableOpacity onPress={() => setShowModal(false)}>
                 <Text style={styles.backText}>{t("back")}</Text>
               </TouchableOpacity>
               <Text style={styles.modalTitle}>{t("createAdmin")}</Text>
               <View style={styles.headerSpacer} />
             </View>

           <ScrollView
             style={styles.modalContent}
             contentContainerStyle={styles.modalBody}
             keyboardShouldPersistTaps="always"
           >
             {error ? (
               <View style={styles.errorContainer}>
                 <Text style={styles.errorText}>{error}</Text>
               </View>
             ) : null}

             <View style={styles.infoCard}>
               <Text style={styles.infoTitle}>{t("importantInfo")}</Text>
               <Text style={styles.infoText}>
                 {t("adminInfo")}
               </Text>
             </View>

             <Text style={styles.label}>{t("username")}</Text>
             <TextInput
               style={styles.input}
               placeholder={t("loginPlaceholder_Admin")}
               placeholderTextColor={colors.textTertiary}
               value={username}
               onChangeText={setUsername}
               autoCapitalize="none"
               autoCorrect={false}
             />

             <Text style={styles.label}>{t("password")}</Text>
             <TextInput
               style={styles.input}
               placeholder={t("passwordPlaceholder_Admin")}
               placeholderTextColor={colors.textTertiary}
               value={password}
               onChangeText={setPassword}
               secureTextEntry
               autoCapitalize="none"
               autoCorrect={false}
             />

             <TouchableOpacity
               style={[styles.createButton, isCreating && styles.createButtonDisabled]}
               onPress={handleCreateAdmin}
               disabled={isCreating}
             >
               {isCreating ? (
                 <ActivityIndicator size="small" color={colors.white} />
               ) : (
                 <Text style={styles.createButtonText}>{t("confirmCreate")}</Text>
               )}
             </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: colors.text,
  },
  logoutButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: colors.danger,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: colors.textSecondary,
  },
  list: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  adminCard: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  adminInfo: {
    gap: SPACING.xs,
  },
  adminName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: colors.text,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.primary,
  },
  roleText: {
    color: colors.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: "600",
  },
  adminDate: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  addButtonText: {
    color: colors.white,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backText: {
    fontSize: FONT_SIZE.md,
    color: colors.primary,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
    color: colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
  },
  modalBody: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  errorContainer: {
    backgroundColor: colors.danger + "15",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: colors.danger + "40",
  },
  errorText: {
    color: colors.danger,
    fontSize: FONT_SIZE.sm,
  },
  infoCard: {
    backgroundColor: colors.primary + "10",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: colors.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.secondary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: colors.white,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
  });