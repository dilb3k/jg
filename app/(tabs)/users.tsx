import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Pencil,
  Trash2,
  Users,
  CreditCard,
  Shield,
  LogOut,
  X,
} from "lucide-react-native";

import { SPACING, FONT_SIZE, BORDER_RADIUS, type ThemeColors } from "../../src/theme";
import { useAuthStore } from "../../src/store/selectors";
import { useStore } from "../../src/store";
import { apiClient } from "../../src/api/client";
import type { AuthUser } from "../../src/types";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";

const TIERS = ["tekin", "bor", "pro"] as const;

function daysUntilExpiry(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getTierLabel(tier: string, t: (key: any) => string): string {
  if (tier === "pro") return t("planPro");
  if (tier === "bor") return t("planBor");
  if (tier === "superAdmin") return t("superAdmin");
  return t("planFree");
}

function getTierColor(tier: string, colors: ThemeColors): string {
  if (tier === "pro") return colors.primary;
  if (tier === "bor") return colors.success;
  if (tier === "superAdmin") return colors.warning;
  return colors.textTertiary;
}



export default function AdminsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { showToast } = useStore();
  const [admins, setAdmins] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createTier, setCreateTier] = useState<"tekin" | "bor" | "pro">("bor");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [editingAdmin, setEditingAdmin] = useState<AuthUser | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editTier, setEditTier] = useState<"tekin" | "bor" | "pro">("bor");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AuthUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const stats = useMemo(() => {
    const total = admins.length;
    const activeSubs = admins.filter((a) => a.tier !== "tekin").length;
    return { total, activeSubs };
  }, [admins]);

  const loadAdmins = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAdmins();
      setAdmins(data);
    } catch (err: any) {
      showToast(err.message || t("errorLoadingAdmins"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    if (user?.role?.toLowerCase() !== "superadmin") {
      router.replace("/(tabs)");
      return;
    }
    loadAdmins();
  }, [user?.role, router, loadAdmins]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await apiClient.getAdmins();
      setAdmins(data);
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  }, []);

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
      await apiClient.createAdmin(createUsername.trim(), createPassword, createTier);
      setShowCreateModal(false);
      setCreateUsername("");
      setCreatePassword("");
      setCreateTier("bor");
      await loadAdmins();
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
    const adminTier = admin.tier === "pro" ? "pro" : admin.tier === "bor" ? "bor" : "tekin";
    setEditTier(adminTier);
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
      const data: { username: string; password?: string; tier?: "tekin" | "bor" | "pro" } = {
        username: editUsername.trim(),
        tier: editTier,
      };
      if (editPassword) data.password = editPassword;

      await apiClient.updateAdmin(editingAdmin.id, data);
      setEditingAdmin(null);
      setEditUsername("");
      setEditPassword("");
      setEditTier("bor");
      await loadAdmins();
      showToast(t("userUpdated"), "success");
    } catch (err: any) {
      setEditError(err.message || t("editUserError"));
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteAdmin(deleteTarget.id);
      setDeleteTarget(null);
      await loadAdmins();
      showToast(t("userDeleted"), "success");
    } catch (err: any) {
      showToast(err.message || t("deleteUserError"), "error");
    } finally {
      setIsDeleting(false);
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

  if (user?.role?.toLowerCase() !== "superadmin") {
    return null;
  }

  const renderAdminCard = ({ item }: { item: AuthUser }) => {
    const days = daysUntilExpiry(item.subscriptionEndDate);
    const tierColor = getTierColor(item.tier, colors);

    return (
      <View style={styles.adminCard}>
        <View style={styles.adminInfo}>
          <View style={styles.adminNameRow}>
            <Text style={styles.adminName} numberOfLines={1}>{item.username}</Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary + "20" }]}>
              <Shield size={10} color={colors.primary} />
              <Text style={[styles.roleText, { color: colors.primary }]}>
                {item.role === "superAdmin" ? t("superAdmin") : t("admin")}
              </Text>
            </View>
          </View>

          <View style={styles.adminMetaRow}>
            <View style={[styles.tierBadge, { backgroundColor: tierColor + "20" }]}>
              <CreditCard size={11} color={tierColor} />
              <Text style={[styles.tierText, { color: tierColor }]}>
                {getTierLabel(item.tier, t)}
              </Text>
            </View>

            {item.tier !== "tekin" && days !== null && (
              <Text style={[styles.daysText, {
                color: days <= 0 ? colors.danger : days <= 3 ? colors.warning : colors.textTertiary
              }]}>
                {days <= 0 ? t("subscriptionExpired") : t("subscriptionDaysLeft", { days })}
              </Text>
            )}
            {item.tier === "pro" && days === null && (
              <Text style={[styles.daysText, { color: colors.success }]}>
                {t("cheksiz")}
              </Text>
            )}
          </View>

          <Text style={styles.adminDate}>
            {t("createdAt")}: {new Date(item.createdAt).toLocaleDateString("uz-UZ", {
              year: "numeric", month: "long", day: "numeric"
            })}
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
            onPress={() => setDeleteTarget(item)}
          >
            <Trash2 size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t("usersTitle")}</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <LogOut size={18} color={colors.danger} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.primary + "12" }]}>
            <Users size={20} color={colors.primary} />
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("totalAdmins")}</Text>
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.success + "12" }]}>
            <CreditCard size={20} color={colors.success} />
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.activeSubs}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("activeSubscriptions")}</Text>
            </View>
          </View>
        </View>

      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t("loading")}</Text>
        </View>
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => item.id}
          renderItem={renderAdminCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>{t("noProducts")}</Text>
            </View>
          }
        />
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            setShowCreateModal(true);
            setCreateError(null);
            setCreateUsername("");
            setCreatePassword("");
            setCreateTier("bor");
          }}
        >
          <Text style={styles.addButtonText}>+ {t("createUser")}</Text>
        </Pressable>
      </View>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { paddingTop: insets.top }]}
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

            <Text style={styles.label}>{t("selectTier")}</Text>
            <View style={styles.tierPicker}>
              {TIERS.map((tier) => {
                const tierColor = tier === "pro" ? colors.primary : tier === "bor" ? colors.success : colors.textTertiary;
                const tierLabel = tier === "pro" ? t("planPro") : tier === "bor" ? t("planBor") : t("planFree");
                return (
                  <TouchableOpacity
                    key={tier}
                    style={[
                      styles.tierOption,
                      createTier === tier && {
                        backgroundColor: tierColor + "20",
                        borderColor: tierColor,
                      },
                    ]}
                    onPress={() => setCreateTier(tier)}
                  >
                    <CreditCard
                      size={16}
                      color={createTier === tier ? tierColor : colors.textTertiary}
                    />
                    <Text style={[
                      styles.tierOptionText,
                      { color: createTier === tier ? tierColor : colors.textSecondary }
                    ]}>
                      {tierLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
          style={[styles.modalContainer, { paddingTop: insets.top }]}
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

            <Text style={styles.label}>{t("selectTier")}</Text>
            <View style={styles.tierPicker}>
              {TIERS.map((tier) => {
                const tierColor = tier === "pro" ? colors.primary : tier === "bor" ? colors.success : colors.textTertiary;
                const tierLabel = tier === "pro" ? t("planPro") : tier === "bor" ? t("planBor") : t("planFree");
                return (
                  <TouchableOpacity
                    key={tier}
                    style={[
                      styles.tierOption,
                      editTier === tier && {
                        backgroundColor: tierColor + "20",
                        borderColor: tierColor,
                      },
                    ]}
                    onPress={() => setEditTier(tier)}
                  >
                    <CreditCard
                      size={16}
                      color={editTier === tier ? tierColor : colors.textTertiary}
                    />
                    <Text style={[
                      styles.tierOptionText,
                      { color: editTier === tier ? tierColor : colors.textSecondary }
                    ]}>
                      {tierLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deleteTarget}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteTarget(null)}
      >
        <Pressable
          style={[styles.deleteOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setDeleteTarget(null)}
        >
          <Pressable
            style={[styles.deleteModal, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.deleteHeader}>
              <View style={[styles.deleteIconWrap, { backgroundColor: colors.danger + "20" }]}>
                <Trash2 size={24} color={colors.danger} />
              </View>
              <TouchableOpacity onPress={() => setDeleteTarget(null)}>
                <X size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.deleteTitle, { color: colors.text }]}>
              {t("deleteUserTitle")}
            </Text>
            <Text style={[styles.deleteMessage, { color: colors.textSecondary }]}>
              {t("deleteUserConfirm").replace("{username}", deleteTarget?.username || "")}
            </Text>

            <View style={styles.deleteActions}>
              <Pressable
                style={[styles.deleteCancelBtn, { backgroundColor: colors.background }]}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={[styles.deleteCancelText, { color: colors.text }]}>
                  {t("cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.deleteConfirmBtn, { backgroundColor: colors.danger }]}
                onPress={handleDeleteAdmin}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={[styles.deleteConfirmText, { color: colors.white }]}>
                    {t("delete")}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
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
      padding: SPACING.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: SPACING.md,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: "700",
      color: colors.text,
    },
    logoutButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.danger + "40",
    },
    statsRow: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    statCard: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
    },
    statInfo: {
      gap: 2,
    },
    statValue: {
      fontSize: FONT_SIZE.xl,
      fontWeight: "700",
    },
    statLabel: {
      fontSize: FONT_SIZE.xs,
      fontWeight: "500",
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
    adminNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    adminName: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
      color: colors.text,
      flex: 1,
    },
    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: BORDER_RADIUS.full,
    },
    roleText: {
      fontSize: FONT_SIZE.xs,
      fontWeight: "600",
    },
    adminMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      flexWrap: "wrap",
    },
    tierBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: BORDER_RADIUS.full,
    },
    tierText: {
      fontSize: FONT_SIZE.xs,
      fontWeight: "700",
    },
    daysText: {
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
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: SPACING.md,
    },
    emptyText: {
      fontSize: FONT_SIZE.md,
      color: colors.textTertiary,
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
    tierPicker: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    tierOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    tierOptionText: {
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
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
    deleteOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.xl,
    },
    deleteModal: {
      width: "100%",
      maxWidth: 340,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
    },
    deleteHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: SPACING.md,
    },
    deleteIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: "700",
      marginBottom: SPACING.sm,
    },
    deleteMessage: {
      fontSize: FONT_SIZE.md,
      lineHeight: 22,
      marginBottom: SPACING.lg,
    },
    deleteActions: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    deleteCancelBtn: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
    },
    deleteCancelText: {
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
    },
    deleteConfirmBtn: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
    },
    deleteConfirmText: {
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
    },
  });