import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Pencil, Trash2, Lock, Unlock } from "lucide-react-native";

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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createIsPayed, setCreateIsPayed] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [editingAdmin, setEditingAdmin] = useState<AuthUser | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editIsPayed, setEditIsPayed] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (user?.role?.toLowerCase() !== "superadmin") {
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
      showToast(err.message || t("errorLoadingAdmins"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!createUsername.trim() || !createPassword.trim()) {
      setCreateError(t("enterLoginPassword"));
      return;
    }

    if (createPassword.length < 6) {
      setCreateError(t("passwordLength"));
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      await apiClient.createAdmin(createUsername.trim(), createPassword, createIsPayed);
      setShowCreateModal(false);
      setCreateUsername("");
      setCreatePassword("");
      setCreateIsPayed(false);
      loadAdmins();
      showToast(t("userCreated"), "success");
    } catch (err: any) {
      setCreateError(err.message || t("createUserError"));
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (admin: AuthUser) => {
    setEditingAdmin(admin);
    setEditUsername(admin.username);
    setEditPassword("");
    setEditIsPayed(admin.isPayed ?? false);
    setEditError(null);
  };

  const handleEditAdmin = async () => {
    if (!editingAdmin) return;

    if (!editUsername.trim()) {
      setEditError(t("enterLoginPassword"));
      return;
    }

    if (editPassword && editPassword.length < 6) {
      setEditError(t("passwordLength"));
      return;
    }

    setIsEditing(true);
    setEditError(null);

    try {
      const data: { username?: string; password?: string; isPayed?: boolean } = {
        username: editUsername.trim(),
        isPayed: editIsPayed,
      };
      if (editPassword) data.password = editPassword;

      await apiClient.updateAdmin(editingAdmin.id, data);
      setEditingAdmin(null);
      setEditUsername("");
      setEditPassword("");
      setEditIsPayed(false);
      loadAdmins();
      showToast(t("userUpdated"), "success");
    } catch (err: any) {
      setEditError(err.message || t("editUserError"));
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteAdmin = (admin: AuthUser) => {
    Alert.alert(
      t("deleteUserTitle"),
      t("deleteUserConfirm").replace("{username}", admin.username),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.deleteAdmin(admin.id);
              loadAdmins();
              showToast(t("userDeleted"), "success");
            } catch (err: any) {
              showToast(err.message || t("deleteUserError"), "error");
            }
          },
        },
      ],
    );
  };

  const handleTogglePayed = async (admin: AuthUser) => {
    try {
      await apiClient.updateAdmin(admin.id, { isPayed: !admin.isPayed });
      loadAdmins();
      showToast(admin.isPayed ? t("userUnpayed") : t("userPayed"), "success");
    } catch (err: any) {
      showToast(err.message || t("editUserError"), "error");
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
    switch (role.toLowerCase()) {
      case "superadmin":
        return t("superAdmin");
      case "admin":
        return t("admin");
      default:
        return role;
    }
  };

  if (user?.role?.toLowerCase() !== "superadmin") {
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
                  <View style={styles.adminHeaderRow}>
                    <Text style={styles.adminName}>{item.username}</Text>
                    <TouchableOpacity
                      style={[
                        styles.paidBadge,
                        item.isPayed ? styles.paidBadgeActive : styles.paidBadgeInactive,
                        { backgroundColor: item.isPayed ? colors.success + "20" : colors.danger + "20" },
                      ]}
                      onPress={() => handleTogglePayed(item)}
                    >
                      {item.isPayed ? (
                        <Unlock size={12} color={colors.success} />
                      ) : (
                        <Lock size={12} color={colors.danger} />
                      )}
                      <Text
                        style={[
                          styles.paidBadgeText,
                          { color: item.isPayed ? colors.success : colors.danger },
                        ]}
                      >
                        {item.isPayed ? t("premium") : t("locked")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.roleRow}>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>{getRoleLabel(item.role)}</Text>
                    </View>
                  </View>
                  <Text style={styles.adminDate}>
                    {t("createdAt")}: {formatDate(item.createdAt)}
                  </Text>
                </View>
                <View style={styles.adminActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary + "15" }]}
                    onPress={() => openEditModal(item)}
                  >
                    <Pencil size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.danger + "15" }]}
                    onPress={() => handleDeleteAdmin(item)}
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.list}
          />

          <View style={styles.footer}>
            <Pressable
              style={styles.addButton}
              onPressOut={() => {
                setShowCreateModal(true);
                setCreateError(null);
                setCreateUsername("");
                setCreatePassword("");
                setCreateIsPayed(false);
              }}
            >
              <Text style={styles.addButtonText}>+ {t("createUser")}</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
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
            {createError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{createError}</Text>
              </View>
            ) : null}

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{t("importantInfo")}</Text>
              <Text style={styles.infoText}>{t("adminInfo")}</Text>
            </View>

            <Text style={styles.label}>{t("username")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("loginPlaceholder_Admin")}
              placeholderTextColor={colors.textTertiary}
              value={createUsername}
              onChangeText={setCreateUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>{t("password")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("passwordPlaceholder_Admin")}
              placeholderTextColor={colors.textTertiary}
              value={createPassword}
              onChangeText={setCreatePassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("activatePremium")}</Text>
              <Switch
                value={createIsPayed}
                onValueChange={setCreateIsPayed}
                trackColor={{ false: colors.border, true: colors.success + "80" }}
                thumbColor={createIsPayed ? colors.success : colors.white}
              />
            </View>

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

      {/* Edit Modal */}
      <Modal
        visible={!!editingAdmin}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingAdmin(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingAdmin(null)}>
              <Text style={styles.backText}>{t("back")}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t("editAdmin")}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="always"
          >
            {editError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{editError}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>{t("username")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("loginPlaceholder_Admin")}
              placeholderTextColor={colors.textTertiary}
              value={editUsername}
              onChangeText={setEditUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>{t("passwordNew")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("passwordPlaceholder_Admin")}
              placeholderTextColor={colors.textTertiary}
              value={editPassword}
              onChangeText={setEditPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("activatePremium")}</Text>
              <Switch
                value={editIsPayed}
                onValueChange={setEditIsPayed}
                trackColor={{ false: colors.border, true: colors.success + "80" }}
                thumbColor={editIsPayed ? colors.success : colors.white}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, isEditing && styles.createButtonDisabled]}
              onPress={handleEditAdmin}
              disabled={isEditing}
            >
              {isEditing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.createButtonText}>{t("confirmSave")}</Text>
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
    flexDirection: "row",
    alignItems: "center",
  },
  adminInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  adminHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adminName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: colors.text,
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  paidBadgeActive: {
    borderWidth: 1,
  },
  paidBadgeInactive: {
    borderWidth: 1,
  },
  paidBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
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
  adminActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: colors.text,
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
