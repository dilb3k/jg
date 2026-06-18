import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ShoppingCart,
  Search,
  Filter,
  LayoutGrid,
  List,
  Activity,
} from "lucide-react-native";

import { SPACING, FONT_SIZE, BORDER_RADIUS, type ThemeColors } from "../../src/theme";
import { useAuthStore } from "../../src/store/selectors";
import { useStore } from "../../src/store";
import { apiClient } from "../../src/api/client";
import { formatMoney } from "../../src/utils/inventory";
import type { AdminStatsItem, AdminStatsResponse } from "../../src/types";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";


const TIERS = ["tekin", "bor", "pro"] as const;

function daysUntilExpiry(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getTierColor(tier: string, colors: ThemeColors): string {
  if (tier === "pro") return colors.primary;
  if (tier === "bor") return colors.success;
  return colors.textTertiary;
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export default function AdminsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { showToast } = useStore();

  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "admins">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "free">("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createTier, setCreateTier] = useState<"tekin" | "bor" | "pro">("bor");
  const [createDuration, setCreateDuration] = useState<1 | 6 | 12>(1);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [editingAdmin, setEditingAdmin] = useState<AdminStatsItem | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editTier, setEditTier] = useState<"tekin" | "bor" | "pro">("bor");
  const [editDuration, setEditDuration] = useState<1 | 6 | 12>(1);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminStatsItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const stats = await apiClient.getAdminStats();
      setData(stats);
    } catch (err: any) {
      showToast(err.message || t("errorLoadingAdmins"), "error");
    }
  }, [showToast, t]);

  useEffect(() => {
    if (user?.role?.toLowerCase() !== "superadmin") {
      router.replace("/(tabs)");
      return;
    }
    (async () => {
      setIsLoading(true);
      await loadStats();
      setIsLoading(false);
    })();
  }, [user?.role, router, loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

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
      await apiClient.createAdmin(createUsername.trim(), createPassword, createTier, createPhone.trim() || undefined, createDuration);
      setShowCreateModal(false);
      setCreateUsername("");
      setCreatePassword("");
      setCreatePhone("");
      setCreateTier("bor");
      setCreateDuration(1);
      await loadStats();
      showToast(t("userCreated"), "success");
    } catch (err: any) {
      setCreateError(err.message || t("createUserError"));
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (admin: AdminStatsItem) => {
    setEditingAdmin(admin);
    setEditUsername(admin.username);
    setEditPhone(admin.phone_number || "");
    setEditPassword("");
    const adminTier = admin.tier === "pro" ? "pro" : admin.tier === "bor" ? "bor" : "tekin";
    setEditTier(adminTier);
    setEditDuration(1);
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
      const payload: { username: string; password?: string; tier?: "tekin" | "bor" | "pro"; durationMonths?: number; phone_number?: string } = {
        username: editUsername.trim(),
        tier: editTier,
        durationMonths: editTier !== "tekin" ? editDuration : undefined,
        phone_number: editPhone.trim() || undefined,
      };
      if (editPassword) payload.password = editPassword;
      await apiClient.updateAdmin(editingAdmin.id, payload);
      setEditingAdmin(null);
      await loadStats();
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
      await loadStats();
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

  const filteredAdmins = useMemo(() => {
    if (!data) return [];
    let list = data.admins;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.username.toLowerCase().includes(q) ||
          (a.phone_number || "").includes(q)
      );
    }
    if (statusFilter === "active") {
      list = list.filter((a) => a.daysRemaining > 0);
    } else if (statusFilter === "expired") {
      list = list.filter((a) => a.daysRemaining === 0 && a.tier !== "tekin");
    } else if (statusFilter === "free") {
      list = list.filter((a) => a.tier === "tekin");
    }
    return list;
  }, [data, searchQuery, statusFilter]);

  if (user?.role?.toLowerCase() !== "superadmin") {
    return null;
  }

  const renderAdminCard = ({ item }: { item: AdminStatsItem }) => {
    const days = daysUntilExpiry(item.subscriptionEndDate);
    const tierColor = getTierColor(item.tier, colors);
    const isExpanded = expandedId === item.id;
    const lastActive = item.lastActive
      ? new Date(item.lastActive).toLocaleDateString("uz-UZ", {
          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        })
      : "—";

    return (
      <View style={[styles.adminCard, isExpanded && styles.adminCardExpanded]}>
        <View style={styles.adminCardMain}>
          <View style={[styles.avatar, { backgroundColor: tierColor + "20", borderColor: tierColor + "40" }]}>
            <Text style={[styles.avatarText, { color: tierColor }]}>{getInitials(item.username)}</Text>
          </View>

          <View style={styles.adminInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.adminName} numberOfLines={1}>{item.username}</Text>
              {item.phone_number ? (
                <Text style={[styles.phoneText, { color: colors.textTertiary }]}>{item.phone_number}</Text>
              ) : null}
            </View>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
                <Shield size={10} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {item.role === "superAdmin" ? t("superAdmin") : t("admin")}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: tierColor + "15" }]}>
                <CreditCard size={10} color={tierColor} />
                <Text style={[styles.badgeText, { color: tierColor }]}>
                  {item.tier === "pro" ? t("planPro") : item.tier === "bor" ? t("planBor") : t("planFree")}
                </Text>
              </View>
              {days !== null && days > 0 && (
                <View style={[styles.badge, {
                  backgroundColor: days <= 3 ? colors.warning + "20" : colors.success + "15",
                }]}>
                  <Text style={[styles.badgeText, {
                    color: days <= 3 ? colors.warning : colors.success,
                    fontWeight: "700",
                  }]}>
                    {days} {t("daysLeft")}
                  </Text>
                </View>
              )}
              {days === 0 && (
                <View style={[styles.badge, { backgroundColor: colors.danger + "15" }]}>
                  <Text style={[styles.badgeText, { color: colors.danger }]}>{t("subscriptionExpired")}</Text>
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Package size={13} color={colors.textTertiary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{item.productCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t("products")}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <DollarSign size={13} color={colors.success} />
                <Text style={[styles.statValue, { color: colors.success }]}>{formatMoney(item.totalRevenue)}</Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t("revenue")}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <TrendingUp size={13} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.primary }]}>{formatMoney(item.totalProfit)}</Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t("profit")}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ShoppingCart size={13} color={colors.warning} />
                <Text style={[styles.statValue, { color: colors.text }]}>{item.totalSoldItems}</Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t("sold")}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock size={12} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {t("createdAt")}: {new Date(item.createdAt).toLocaleDateString("uz-UZ", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={12} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  Faol: {lastActive}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary + "12" }]}
              onPress={() => openEditModal(item)}
            >
              <Pencil size={15} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.danger + "12" }]}
              onPress={() => setDeleteTarget(item)}
            >
              <Trash2 size={15} color={colors.danger} />
            </TouchableOpacity>
            {item.topProducts.length > 0 && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.secondary + "12" }]}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {isExpanded ? (
                  <ChevronUp size={15} color={colors.secondary} />
                ) : (
                  <ChevronDown size={15} color={colors.secondary} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isExpanded && item.topProducts.length > 0 && (
          <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.expandedTitle, { color: colors.textSecondary }]}>
              <BarChart3 size={14} color={colors.textSecondary} /> Eng ko{`'`}p sotilgan mahsulotlar
            </Text>
            {item.topProducts.map((p, idx) => (
              <View key={p.productId} style={[styles.productRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border + "60" }]}>
                <View style={styles.productRank}>
                  <Text style={[styles.productRankText, { color: colors.textTertiary }]}>{idx + 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.productSold, { color: colors.textTertiary }]}>
                    Sotildi: {p.totalSold} dona
                  </Text>
                </View>
                <View style={styles.productStats}>
                  <Text style={[styles.productRevenue, { color: colors.success }]}>{formatMoney(p.totalRevenue)}</Text>
                  <Text style={[styles.productProfit, { color: colors.primary }]}>+{formatMoney(p.totalProfit)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === "overview" && styles.tabBtnActive]}
        onPress={() => setActiveTab("overview")}
      >
        <LayoutGrid size={15} color={activeTab === "overview" ? colors.primary : colors.textTertiary} />
        <Text style={[styles.tabBtnText, activeTab === "overview" && styles.tabBtnTextActive]}>
          Umumiy
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === "admins" && styles.tabBtnActive]}
        onPress={() => setActiveTab("admins")}
      >
        <List size={15} color={activeTab === "admins" ? colors.primary : colors.textTertiary} />
        <Text style={[styles.tabBtnText, activeTab === "admins" && styles.tabBtnTextActive]}>
          Adminlar
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverview = () => (
    <ScrollView style={styles.overviewContainer} contentContainerStyle={styles.overviewContent} showsVerticalScrollIndicator={false}>
      <View style={styles.overviewGrid}>
        <View style={[styles.overviewCardLarge, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
          <View style={[styles.overviewIconLarge, { backgroundColor: colors.primary + "15" }]}>
            <Users size={24} color={colors.primary} />
          </View>
          <Text style={[styles.overviewValueLarge, { color: colors.text }]}>{data?.admins.length ?? 0}</Text>
          <Text style={[styles.overviewLabelLarge, { color: colors.textTertiary }]}>{t("totalAdmins")}</Text>
        </View>
        <View style={[styles.overviewCardLarge, { backgroundColor: colors.warning + "08", borderColor: colors.warning + "20" }]}>
          <View style={[styles.overviewIconLarge, { backgroundColor: colors.warning + "15" }]}>
            <Package size={24} color={colors.warning} />
          </View>
          <Text style={[styles.overviewValueLarge, { color: colors.text }]}>{data?.totals.totalProducts ?? 0}</Text>
          <Text style={[styles.overviewLabelLarge, { color: colors.textTertiary }]}>{t("totalProducts")}</Text>
        </View>
        <View style={[styles.overviewCardLarge, { backgroundColor: colors.success + "08", borderColor: colors.success + "20" }]}>
          <View style={[styles.overviewIconLarge, { backgroundColor: colors.success + "15" }]}>
            <DollarSign size={24} color={colors.success} />
          </View>
          <Text style={[styles.overviewValueLarge, { color: colors.success }]}>{formatMoney(data?.totals.totalRevenue ?? 0)}</Text>
          <Text style={[styles.overviewLabelLarge, { color: colors.textTertiary }]}>{t("totalRevenueLabel")}</Text>
        </View>
        <View style={[styles.overviewCardLarge, { backgroundColor: colors.secondary + "08", borderColor: colors.secondary + "20" }]}>
          <View style={[styles.overviewIconLarge, { backgroundColor: colors.secondary + "15" }]}>
            <TrendingUp size={24} color={colors.secondary} />
          </View>
          <Text style={[styles.overviewValueLarge, { color: colors.secondary }]}>{formatMoney(data?.totals.totalProfit ?? 0)}</Text>
          <Text style={[styles.overviewLabelLarge, { color: colors.textTertiary }]}>{t("profit")}</Text>
        </View>
        <View style={[styles.overviewCardLarge, { backgroundColor: colors.warning + "08", borderColor: colors.warning + "20" }]}>
          <View style={[styles.overviewIconLarge, { backgroundColor: colors.warning + "15" }]}>
            <ShoppingCart size={24} color={colors.warning} />
          </View>
          <Text style={[styles.overviewValueLarge, { color: colors.text }]}>{data?.totals.totalSoldItems ?? 0}</Text>
          <Text style={[styles.overviewLabelLarge, { color: colors.textTertiary }]}>{t("sold")}</Text>
        </View>
        <View style={[styles.overviewCardLarge, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
          <View style={[styles.overviewIconLarge, { backgroundColor: colors.success + "15" }]}>
            <CreditCard size={24} color={colors.success} />
          </View>
          <Text style={[styles.overviewValueLarge, { color: colors.text }]}>{data?.totals.activeSubscriptions ?? 0}</Text>
          <Text style={[styles.overviewLabelLarge, { color: colors.textTertiary }]}>{t("activeSubscriptions")}</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + "15" }]}>
              <Shield size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>{t("usersTitle")}</Text>
              <Text style={styles.headerSub}>{t("superAdmin")} panel</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { borderColor: colors.border }]}
              onPress={onRefresh}
            >
              <Activity size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <LogOut size={16} color={colors.danger} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        {renderTabBar()}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t("loading")}</Text>
        </View>
      ) : activeTab === "overview" ? (
        renderOverview()
      ) : data ? (
        <FlatList
          data={filteredAdmins}
          keyExtractor={(item) => item.id}
          renderItem={renderAdminCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <View style={styles.searchFilterRow}>
              <View style={styles.searchWrapper}>
                <Search size={14} color={colors.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t("searchAdmins")}
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <X size={14} color={colors.textTertiary} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity
                style={[styles.filterBtn, { borderColor: colors.border }]}
                onPress={() => {
                  const next = { all: "active", active: "expired", expired: "free", free: "all" } as const;
                  setStatusFilter(next[statusFilter]);
                }}
              >
                <Filter size={14} color={statusFilter !== "all" ? colors.primary : colors.textTertiary} />
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>{t("noAdmins")}</Text>
            </View>
          }
        />
      ) : null}

      {activeTab === "admins" && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
          <Pressable
            style={styles.addButton}
            onPress={() => {
              setShowCreateModal(true);
              setCreateError(null);
              setCreateUsername("");
              setCreatePassword("");
              setCreatePhone("");
              setCreateTier("bor");
            }}
          >
            <Text style={styles.addButtonText}>+ {t("createUser")}</Text>
          </Pressable>
        </View>
      )}

      {/* Create Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView style={[styles.modalContainer, { paddingTop: insets.top }]} behavior="padding">
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.backText}>{t("back")}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t("createAdmin")}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="always">
            {createError ? (
              <View style={styles.errorBox}><Text style={styles.errorText}>{createError}</Text></View>
            ) : null}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>{t("importantInfo")}</Text>
              <Text style={styles.infoText}>{t("adminInfo")}</Text>
            </View>

            <Text style={styles.label}>{t("loginLabel")}</Text>
            <TextInput style={styles.input} placeholder={t("loginPlaceholder_Admin")} placeholderTextColor={colors.textTertiary} value={createUsername} onChangeText={setCreateUsername} autoCapitalize="none" autoCorrect={false} />

            <Text style={styles.label}>{t("authPhoneNumber")}</Text>
            <TextInput style={styles.input} placeholder="+998 90 123 45 67" placeholderTextColor={colors.textTertiary} value={createPhone} onChangeText={setCreatePhone} keyboardType="phone-pad" autoCapitalize="none" />

            <Text style={styles.label}>{t("password")}</Text>
            <TextInput style={styles.input} placeholder={t("passwordPlaceholder_Admin")} placeholderTextColor={colors.textTertiary} value={createPassword} onChangeText={setCreatePassword} secureTextEntry autoCapitalize="none" autoCorrect={false} />

            <Text style={styles.label}>{t("selectTier")}</Text>
            <View style={styles.tierPicker}>
              {TIERS.map((tier) => {
                const c = tier === "pro" ? colors.primary : tier === "bor" ? colors.success : colors.textTertiary;
                return (
                  <TouchableOpacity key={tier} style={[styles.tierOption, createTier === tier && { backgroundColor: c + "20", borderColor: c }]} onPress={() => setCreateTier(tier)}>
                    <CreditCard size={16} color={createTier === tier ? c : colors.textTertiary} />
                    <Text style={[styles.tierOptionText, { color: createTier === tier ? c : colors.textSecondary }]}>
                      {tier === "pro" ? t("planPro") : tier === "bor" ? t("planBor") : t("planFree")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {createTier !== "tekin" && (
              <>
                <Text style={styles.label}>Muddat</Text>
                <View style={styles.tierPicker}>
                  {([1, 6, 12] as const).map((m) => {
                    const active = createDuration === m;
                    return (
                      <TouchableOpacity key={m} style={[styles.tierOption, active && { backgroundColor: colors.primary + "20", borderColor: colors.primary }]} onPress={() => setCreateDuration(m)}>
                        <Text style={[styles.tierOptionText, { color: active ? colors.primary : colors.textSecondary, fontSize: 13 }]}>
                          {m === 1 ? "1 oy" : m === 6 ? "6 oy" : "12 oy"}
                        </Text>
                        {m === 6 && <Text style={{ fontSize: 8, color: colors.success, fontWeight: "600" }}>-6%</Text>}
                        {m === 12 && <Text style={{ fontSize: 8, color: colors.success, fontWeight: "600" }}>-12%</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity style={[styles.submitBtn, isCreating && { opacity: 0.7 }]} onPress={handleCreateAdmin} disabled={isCreating}>
              {isCreating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>{t("confirmCreate")}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editingAdmin} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditingAdmin(null)}>
        <KeyboardAvoidingView style={[styles.modalContainer, { paddingTop: insets.top }]} behavior="padding">
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingAdmin(null)}><Text style={styles.backText}>{t("back")}</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>{t("editAdmin")}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="always">
            {editError ? <View style={styles.errorBox}><Text style={styles.errorText}>{editError}</Text></View> : null}

            <Text style={styles.label}>{t("loginLabel")}</Text>
            <TextInput style={styles.input} placeholder={t("loginPlaceholder_Admin")} placeholderTextColor={colors.textTertiary} value={editUsername} onChangeText={setEditUsername} autoCapitalize="none" autoCorrect={false} />

            <Text style={styles.label}>{t("authPhoneNumber")}</Text>
            <TextInput style={styles.input} placeholder="+998 90 123 45 67" placeholderTextColor={colors.textTertiary} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" autoCapitalize="none" />

            <Text style={styles.label}>{t("passwordNew")}</Text>
            <TextInput style={styles.input} placeholder={t("passwordPlaceholder_Admin")} placeholderTextColor={colors.textTertiary} value={editPassword} onChangeText={setEditPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} />

            <Text style={styles.label}>{t("selectTier")}</Text>
            <View style={styles.tierPicker}>
              {TIERS.map((tier) => {
                const c = tier === "pro" ? colors.primary : tier === "bor" ? colors.success : colors.textTertiary;
                return (
                  <TouchableOpacity key={tier} style={[styles.tierOption, editTier === tier && { backgroundColor: c + "20", borderColor: c }]} onPress={() => setEditTier(tier)}>
                    <CreditCard size={16} color={editTier === tier ? c : colors.textTertiary} />
                    <Text style={[styles.tierOptionText, { color: editTier === tier ? c : colors.textSecondary }]}>
                      {tier === "pro" ? t("planPro") : tier === "bor" ? t("planBor") : t("planFree")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {editTier !== "tekin" && (
              <>
                <Text style={styles.label}>Muddat</Text>
                <View style={styles.tierPicker}>
                  {([1, 6, 12] as const).map((m) => {
                    const active = editDuration === m;
                    return (
                      <TouchableOpacity key={m} style={[styles.tierOption, active && { backgroundColor: colors.primary + "20", borderColor: colors.primary }]} onPress={() => setEditDuration(m)}>
                        <Text style={[styles.tierOptionText, { color: active ? colors.primary : colors.textSecondary, fontSize: 13 }]}>
                          {m === 1 ? "1 oy" : m === 6 ? "6 oy" : "12 oy"}
                        </Text>
                        {m === 6 && <Text style={{ fontSize: 8, color: colors.success, fontWeight: "600" }}>-6%</Text>}
                        {m === 12 && <Text style={{ fontSize: 8, color: colors.success, fontWeight: "600" }}>-12%</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity style={[styles.submitBtn, isEditing && { opacity: 0.7 }]} onPress={handleEditAdmin} disabled={isEditing}>
              {isEditing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>{t("confirmSave")}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={!!deleteTarget} animationType="fade" transparent onRequestClose={() => setDeleteTarget(null)}>
        <Pressable style={[styles.deleteOverlay, { backgroundColor: colors.overlay }]} onPress={() => setDeleteTarget(null)}>
          <Pressable style={[styles.deleteModal, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.deleteHeader}>
              <View style={[styles.deleteIconWrap, { backgroundColor: colors.danger + "20" }]}>
                <Trash2 size={24} color={colors.danger} />
              </View>
              <TouchableOpacity onPress={() => setDeleteTarget(null)}><X size={20} color={colors.textTertiary} /></TouchableOpacity>
            </View>
            <Text style={[styles.deleteTitle, { color: colors.text }]}>{t("deleteUserTitle")}</Text>
            <Text style={[styles.deleteMessage, { color: colors.textSecondary }]}>
              {t("deleteUserConfirm", { username: deleteTarget?.username || "" })}
            </Text>
            <View style={styles.deleteActions}>
              <Pressable style={[styles.deleteCancelBtn, { backgroundColor: colors.background }]} onPress={() => setDeleteTarget(null)}>
                <Text style={[styles.deleteCancelText, { color: colors.text }]}>{t("cancel")}</Text>
              </Pressable>
              <Pressable style={[styles.deleteConfirmBtn, { backgroundColor: colors.danger }]} onPress={handleDeleteAdmin} disabled={isDeleting}>
                {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.deleteConfirmText}>{t("delete")}</Text>}
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
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: SPACING.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: SPACING.md },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: colors.text },
    headerSub: { fontSize: FONT_SIZE.xs, color: colors.textTertiary, marginTop: 2 },
    headerIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
    logoutBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.danger + "40" },
    headerRight: { flexDirection: "row", gap: SPACING.sm, alignItems: "center" },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
    iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1 },
    tabBar: { flexDirection: "row", backgroundColor: colors.background, borderRadius: 12, padding: 3 },
    tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10 },
    tabBtnActive: { backgroundColor: colors.surface },
    tabBtnText: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: colors.textTertiary },
    tabBtnTextActive: { color: colors.text },
    overviewContainer: { flex: 1 },
    overviewContent: { padding: SPACING.md, paddingBottom: 100 },
    overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
    overviewCardLarge: { width: "48.5%", padding: SPACING.lg, borderRadius: 16, borderWidth: 1, gap: SPACING.xs },
    overviewIconLarge: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 4 },
    overviewValueLarge: { fontSize: 26, fontWeight: "800" },
    overviewLabelLarge: { fontSize: FONT_SIZE.xs, fontWeight: "500" },
    searchFilterRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
    searchWrapper: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: SPACING.md, gap: SPACING.sm },
    searchInput: { flex: 1, paddingVertical: SPACING.sm, fontSize: FONT_SIZE.sm, color: colors.text },
    filterBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
    loadingText: { fontSize: FONT_SIZE.md, color: colors.textSecondary },
    list: { padding: SPACING.md, paddingBottom: 100 },
    adminCard: { backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.xl, marginBottom: SPACING.md, borderWidth: 1, borderColor: colors.border, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    adminCardExpanded: { borderColor: colors.secondary + "40" },
    adminCardMain: { flexDirection: "row", padding: SPACING.md, gap: SPACING.md },
    avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: "center", alignItems: "center" },
    avatarText: { fontSize: FONT_SIZE.md, fontWeight: "700" },
    adminInfo: { flex: 1, gap: SPACING.xs },
    nameRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
    adminName: { fontSize: FONT_SIZE.md, fontWeight: "700", color: colors.text },
    phoneText: { fontSize: FONT_SIZE.xs, color: colors.textTertiary },
    badgeRow: { flexDirection: "row", gap: SPACING.xs, flexWrap: "wrap" },
    badge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
    badgeText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginTop: 2 },
    statItem: { flex: 1, alignItems: "center", gap: 1 },
    statDivider: { width: 1, height: 24, backgroundColor: colors.border },
    statValue: { fontSize: FONT_SIZE.xs, fontWeight: "700" },
    statLabel: { fontSize: 9, fontWeight: "500" },
    metaRow: { gap: 2, marginTop: 2 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { fontSize: FONT_SIZE.xs, color: colors.textTertiary },
    actionCol: { gap: SPACING.xs, justifyContent: "center" },
    actionBtn: { width: 32, height: 32, borderRadius: BORDER_RADIUS.md, justifyContent: "center", alignItems: "center" },
    expandedSection: { borderTopWidth: 1, padding: SPACING.md, paddingTop: SPACING.sm },
    expandedTitle: { fontSize: FONT_SIZE.xs, fontWeight: "600", marginBottom: SPACING.sm, flexDirection: "row", alignItems: "center", gap: 4 },
    productRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.xs },
    productRank: { width: 20, alignItems: "center" },
    productRankText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    productInfo: { flex: 1 },
    productName: { fontSize: FONT_SIZE.sm, fontWeight: "600" },
    productSold: { fontSize: FONT_SIZE.xs, color: colors.textTertiary, marginTop: 1 },
    productStats: { alignItems: "flex-end" },
    productRevenue: { fontSize: FONT_SIZE.sm, fontWeight: "700" },
    productProfit: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    addButton: { backgroundColor: colors.primary, padding: SPACING.lg, borderRadius: BORDER_RADIUS.md, alignItems: "center" },
    addButtonText: { color: "#fff", fontSize: FONT_SIZE.md, fontWeight: "700" },
    emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: SPACING.md },
    emptyText: { fontSize: FONT_SIZE.md, color: colors.textTertiary },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
    backText: { fontSize: FONT_SIZE.md, color: colors.primary },
    modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: "600", color: colors.text },
    headerSpacer: { width: 60 },
    modalContent: { flex: 1 },
    modalBody: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
    errorBox: { backgroundColor: colors.danger + "15", borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: colors.danger + "40" },
    errorText: { color: colors.danger, fontSize: FONT_SIZE.sm },
    infoBox: { backgroundColor: colors.primary + "10", borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderLeftWidth: 4, borderLeftColor: colors.primary },
    infoTitle: { fontSize: FONT_SIZE.md, fontWeight: "700", color: colors.primary, marginBottom: SPACING.xs },
    infoText: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, lineHeight: 20 },
    label: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: colors.textSecondary, marginBottom: SPACING.xs },
    input: { backgroundColor: colors.surface, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md, fontSize: FONT_SIZE.md, color: colors.text, borderWidth: 1, borderColor: colors.border },
    tierPicker: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
    tierOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
    tierOptionText: { fontSize: FONT_SIZE.md, fontWeight: "600" },
    submitBtn: { backgroundColor: colors.secondary, padding: SPACING.lg, borderRadius: BORDER_RADIUS.md, alignItems: "center", marginTop: SPACING.sm },
    submitBtnText: { color: "#fff", fontSize: FONT_SIZE.md, fontWeight: "700" },
    deleteOverlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.xl },
    deleteModal: { width: "100%", maxWidth: 340, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg },
    deleteHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.md },
    deleteIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    deleteTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", marginBottom: SPACING.sm },
    deleteMessage: { fontSize: FONT_SIZE.md, lineHeight: 22, marginBottom: SPACING.lg },
    deleteActions: { flexDirection: "row", gap: SPACING.sm },
    deleteCancelBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: "center" },
    deleteCancelText: { fontSize: FONT_SIZE.md, fontWeight: "600" },
    deleteConfirmBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: "center" },
    deleteConfirmText: { color: "#fff", fontSize: FONT_SIZE.md, fontWeight: "600" },
  });