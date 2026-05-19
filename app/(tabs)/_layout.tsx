import { useEffect, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BarChart3,
  ClipboardList,
  Package,
  Home,
  RefreshCw,
  Settings,
  LogOut,
  User,
  Globe,
  Moon,
  Sun,
  Users,
  Wifi,
  WifiOff,
  Lock,
  HandCoins,
  MessageCircle,
  Info,
  ShoppingCart,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";
import { apiClient, setConnectionMode as setApiConnectionMode } from "../../src/api/client";
import { useAppRefreshStore, useAuthStore } from "../../src/store/selectors";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import { SPACING, FONT_SIZE, BORDER_RADIUS } from "../../src/theme";
import { getBusinessDayStartHour, getPendingBusinessDayStartHour, getEffectiveFrom } from "../../src/utils/businessDay";

const TabIcon = ({
  name,
  focused,
  colors,
  isLocked = false,
}: {
  name: string;
  focused: boolean;
  colors: any;
  isLocked?: boolean;
}) => {
  const active = colors.primary;
  const inactive = colors.textTertiary;
  const color = isLocked ? inactive : (focused ? active : inactive);
  const size = 22;

  let IconComponent;
  switch (name) {
    case "index":
      IconComponent = Home;
      break;
    case "products":
      IconComponent = Package;
      break;
    case "inventory":
      IconComponent = ClipboardList;
      break;
    case "statistics":
      IconComponent = BarChart3;
      break;
    case "users":
      IconComponent = Users;
      break;
    case "debtors":
      IconComponent = HandCoins;
      break;
    case "sales":
      IconComponent = ShoppingCart;
      break;
    default:
      IconComponent = Package;
  }

  return (
    <View style={styles.iconContainer}>
      <IconComponent size={size} color={color} />
      {isLocked && (
        <View style={[styles.lockBadge, { backgroundColor: colors.surface }]}>
          <Lock size={10} color={colors.textTertiary} />
        </View>
      )}
    </View>
  );
};

const THEMES = [
  { code: "light", labelKey: "light", icon: Sun },
  { code: "dark", labelKey: "dark", icon: Moon },
];

const CONNECTION_MODES: { code: "online" | "offline"; labelKey: "onlineMode" | "offlineMode"; icon: typeof Wifi }[] = [
  { code: "online", labelKey: "onlineMode", icon: Wifi },
  { code: "offline", labelKey: "offlineMode", icon: WifiOff },
];

function HeaderRefreshButton({ colors, t }: { colors: any; t: any }) {
  const { isLoading, refreshAppData } = useAppRefreshStore();
  const { showToast } = useAppRefreshStore();
  const { setUser } = useAuthStore();

  const handleRefresh = async () => {
    if (isLoading) return;
    try {
      const me = await apiClient.getMe();
      setUser(me);
      await refreshAppData();
      showToast(t("dataRefreshed"), "success");
    } catch {
      showToast(t("refreshError"), "error");
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.refreshButton,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
      onPress={handleRefresh}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <RefreshCw size={18} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}

function HeaderSettingsButton({
  onPress,
  colors,
}: {
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.settingsButton,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Settings size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showBusinessDayModal, setShowBusinessDayModal] = useState(false);
  const [editingHour, setEditingHour] = useState(() => getBusinessDayStartHour());
  const [confirmStep, setConfirmStep] = useState(false);
  const setBusinessDayHour = useStore((state) => state.setBusinessDayHour);

  const openBusinessDayModal = () => {
    setEditingHour(getBusinessDayStartHour());
    setConfirmStep(false);
    setShowBusinessDayModal(true);
  };

  const handleBusinessDayDec = () => {
    setEditingHour((prev) => (prev <= 0 ? 23 : prev - 1));
  };

  const handleBusinessDayInc = () => {
    setEditingHour((prev) => (prev >= 23 ? 0 : prev + 1));
  };

  const handleBusinessDaySave = () => {
    setConfirmStep(true);
  };

  const confirmBusinessDayChange = () => {
    setBusinessDayHour(editingHour);
    setShowBusinessDayModal(false);
    setConfirmStep(false);
  };

  const cancelBusinessDayChange = () => {
    setShowBusinessDayModal(false);
    setConfirmStep(false);
  };

  const { theme, isDark, setTheme, language, setLanguage, connectionMode, setConnectionMode, colors } = useTheme();
  const { t } = useI18n();

  const LANGUAGES = [
    { code: "uz", label: t("lang_uz") },
    { code: "ru", label: t("lang_ru") },
  ];

  useEffect(() => {
    setApiConnectionMode(connectionMode);
  }, [connectionMode]);

  useEffect(() => {
    apiClient.setUnauthorizedHandler(() => {
      logout();
      router.replace("/login");
    });
    apiClient.setConnectionModeChangeHandler((mode) => {
      setConnectionMode(mode);
    });
    return () => {
      apiClient.setUnauthorizedHandler(null);
      apiClient.setConnectionModeChangeHandler(null);
    };
  }, [logout, router, setConnectionMode]);

  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";
  const isPayed = isSuperAdmin || (user?.isPayed ?? false);

  const initialRouteName = isSuperAdmin ? "users" : "products";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowSettings(false);
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLanguageChange = async (code: "uz" | "ru") => {
    await setLanguage(code);
    setShowSettings(false);
  };

  const handleThemeChange = (code: "light" | "dark") => {
    setTheme(code);
    setShowSettings(false);
  };

  const handleConnectionModeChange = async (mode: "online" | "offline") => {
    await setConnectionMode(mode);
    setApiConnectionMode(mode);
  };

  const getThemeLabel = (key: string) =>
    key === "light" ? t("light") : t("dark");

  return (
    <>
      <Tabs
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: true,
          freezeOnBlur: true,
          lazy: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text, fontWeight: "600" },
          headerRight: () => (
            <View style={styles.headerRight}>
              <HeaderRefreshButton colors={colors} t={t} />
              <HeaderSettingsButton
                onPress={() => setShowSettings(true)}
                colors={colors}
              />
            </View>
          ),
           tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
             height: 70 + insets.bottom,
             paddingBottom: Math.max(insets.bottom, 8),
             paddingTop: 8,
           },
           tabBarActiveTintColor: colors.primary,
           tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
          tabBarIconStyle: { marginBottom: -4 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: t("products"),
            href: isSuperAdmin ? null : undefined,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="products" focused={focused} colors={colors} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: t("inventory"),
            href: isSuperAdmin ? null : undefined,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="inventory" focused={focused} colors={colors} />
            ),
          }}
        />
        <Tabs.Screen
          name="sales"
          options={{
            title: t("sales"),
            href: isSuperAdmin ? null : undefined,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="sales" focused={focused} colors={colors} />
            ),
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: t("statistics"),
            href: isSuperAdmin ? null : undefined,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="statistics" focused={focused} colors={colors} isLocked={!isPayed} />
            ),
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: t("users"),
            href: isSuperAdmin ? undefined : null,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="users" focused={focused} colors={colors} />
            ),
          }}
        />
        <Tabs.Screen
          name="debtors"
          options={{
            title: t("debtors"),
            href: isSuperAdmin ? null : undefined,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="debtors" focused={focused} colors={colors} />
            ),
          }}
        />
      </Tabs>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettings(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowSettings(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("settings")}
              </Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>
                  {t("close")}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {user && (
                <View style={styles.section}>
                  <View
                    style={[
                      styles.userInfo,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <User size={20} color={colors.textSecondary} />
                    <View style={styles.userInfoText}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {user.username}
                      </Text>
                      <View style={styles.userRoleContainer}>
                        <Text
                          style={[
                            styles.userRole,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {user.role?.toLowerCase() === "superadmin"
                            ? t("superAdmin")
                            : t("admin")}
                        </Text>
                        {!isPayed && (
                          <View style={[styles.paymentBadge, { backgroundColor: colors.danger + "20" }]}>
                            <Lock size={10} color={colors.danger} />
                            <Text style={[styles.paymentBadgeText, { color: colors.danger }]}>
                              {t("locked")}
                            </Text>
                          </View>
                        )}
                        {isPayed && (
                          <View style={[styles.paymentBadge, { backgroundColor: colors.success + "20" }]}>
                            <Text style={[styles.paymentBadgeText, { color: colors.success }]}>
                              Premium
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Language */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Globe size={18} color={colors.textSecondary} />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("language")}
                  </Text>
                </View>
                <View style={styles.optionsList}>
                  {LANGUAGES.map((lang) => (
                    <Pressable
                      key={lang.code}
                      style={[
                        styles.optionItem,
                        language === lang.code && [
                          styles.optionItemActive,
                          {
                            borderColor: colors.primary,
                            backgroundColor: colors.primary + "15",
                          },
                        ],
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() =>
                        handleLanguageChange(lang.code as "uz" | "ru")
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.text },
                          language === lang.code && {
                            color: colors.primary,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {lang.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Theme */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  {isDark ? (
                    <Moon size={18} color={colors.textSecondary} />
                  ) : (
                    <Sun size={18} color={colors.textSecondary} />
                  )}
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("theme")}
                  </Text>
                </View>
                <View style={styles.optionsList}>
                  {THEMES.map((item) => (
                    <Pressable
                      key={item.code}
                      style={[
                        styles.optionItem,
                        theme === item.code && [
                          styles.optionItemActive,
                          {
                            borderColor: colors.primary,
                            backgroundColor: colors.primary + "15",
                          },
                        ],
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() =>
                        handleThemeChange(item.code as "light" | "dark")
                      }
                    >
                      <item.icon
                        size={18}
                        color={
                          theme === item.code
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.text },
                          theme === item.code && {
                            color: colors.primary,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {getThemeLabel(item.labelKey)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Connection Mode */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  {connectionMode === "online" ? (
                    <Wifi size={18} color={colors.success} />
                  ) : (
                    <WifiOff size={18} color={colors.textSecondary} />
                  )}
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("connectionMode")}
                  </Text>
                </View>
                <View style={styles.optionsList}>
                  {CONNECTION_MODES.map((item) => (
                    <Pressable
                      key={item.code}
                      style={[
                        styles.optionItem,
                        connectionMode === item.code && [
                          styles.optionItemActive,
                          {
                            borderColor: item.code === "online" ? colors.success : colors.textTertiary,
                            backgroundColor: (item.code === "online" ? colors.success : colors.textTertiary) + "15",
                          },
                        ],
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() => handleConnectionModeChange(item.code)}
                    >
                      <item.icon
                        size={18}
                        color={
                          connectionMode === item.code
                            ? item.code === "online" ? colors.success : colors.textTertiary
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.text },
                          connectionMode === item.code && {
                            color: item.code === "online" ? colors.success : colors.textTertiary,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {t(item.labelKey)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Business Day */}
              <View style={styles.section}>
                <Pressable
                  style={[styles.optionItem, { backgroundColor: colors.background }]}
                  onPress={openBusinessDayModal}
                >
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {t("businessDayHour")}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[styles.optionText, { color: colors.textSecondary }]}>
                      {String(getBusinessDayStartHour()).padStart(2, "0")}:00
                    </Text>
                    <Info size={14} color={colors.textTertiary} />
                  </View>
                </Pressable>
              </View>

              {/* Support */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MessageCircle size={18} color={colors.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {t("support")}
                  </Text>
                </View>
                <Pressable
                  style={[styles.optionItem, { backgroundColor: colors.background }]}
                  onPress={() => Linking.openURL("https://t.me/dilbek7011")}
                >
                  <MessageCircle size={18} color="#0088cc" />
                  <Text style={[styles.optionText, { color: "#0088cc" }]}>
                    Telegram: @dilbek7011
                  </Text>
                </Pressable>
              </View>

              {/* Logout */}
              <View style={styles.section}>
                <Pressable
                  style={[
                    styles.logoutButton,
                    { backgroundColor: colors.danger + "15", borderColor: colors.danger + "40" },
                  ]}
                  onPress={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <>
                      <LogOut size={18} color={colors.danger} />
                      <Text style={[styles.logoutText, { color: colors.danger }]}>
                        {t("logout")}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Business Day Modal */}
      <Modal
        visible={showBusinessDayModal}
        animationType="slide"
        transparent
        onRequestClose={cancelBusinessDayChange}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={cancelBusinessDayChange}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {confirmStep ? t("confirm") : t("businessDayHour")}
              </Text>
              <TouchableOpacity onPress={cancelBusinessDayChange}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>
                  {t("close")}
                </Text>
              </TouchableOpacity>
            </View>

            {confirmStep ? (
              <View style={styles.modalBody}>
                <View style={[styles.confirmBody, { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border }]}>
                  <View style={styles.confirmRow}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Joriy vaqt:</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {String(getBusinessDayStartHour()).padStart(2, "0")}:00
                    </Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Yangi vaqt:</Text>
                    <Text style={[styles.confirmValue, { color: colors.primary }]}>
                      {String(editingHour).padStart(2, "0")}:00
                    </Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Kuchga kiradi:</Text>
                    <Text style={[styles.confirmValue, { color: colors.warning }]}>
                      {dayjs().add(1, "day").startOf("day").hour(editingHour).format("DD.MM.YYYY HH:mm")}
                    </Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Hisob davri:</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {dayjs().add(1, "day").startOf("day").hour(editingHour).format("DD.MM HH:mm")} - {dayjs().add(2, "day").startOf("day").hour(editingHour).format("DD.MM HH:mm")}
                    </Text>
                  </View>
                </View>
                <View style={styles.confirmInfo}>
                  <Info size={14} color={colors.warning} />
                  <Text style={[styles.confirmInfoText, { color: colors.textSecondary }]}>
                    {t("businessDayConfirmInfo")}
                  </Text>
                </View>
                <View style={styles.confirmActions}>
                  <Pressable
                    style={[styles.confirmBtn, { backgroundColor: colors.border }]}
                    onPress={() => setConfirmStep(false)}
                  >
                    <Text style={[styles.confirmBtnText, { color: colors.text }]}>{t("back")}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                    onPress={confirmBusinessDayChange}
                  >
                    <Text style={[styles.confirmBtnText, { color: colors.white }]}>{t("confirm")}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                  {t("businessDayHourDesc")}
                </Text>
                {getPendingBusinessDayStartHour() !== null && (
                  <View style={[styles.pendingBadge, { backgroundColor: colors.warning + "20", borderColor: colors.warning + "40", borderWidth: 1, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.sm, flexDirection: "row", alignItems: "center", gap: SPACING.xs }]}>
                    <Info size={14} color={colors.warning} />
                    <Text style={[styles.pendingBadgeText, { color: colors.warning, fontSize: FONT_SIZE.sm, fontWeight: "500" }]}>
                      Kutilayotgan: {String(getPendingBusinessDayStartHour()).padStart(2, "0")}:00 ({dayjs(getEffectiveFrom()).format("DD.MM HH:mm")} dan)
                    </Text>
                  </View>
                )}
                <View style={[styles.businessDayRow, { backgroundColor: colors.background }]}>
                  <TouchableOpacity onPress={handleBusinessDayDec} style={styles.businessDayBtn}>
                    <Text style={[styles.businessDayBtnText, { color: colors.primary }]}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.businessDayTimeWrap}>
                    <Text style={[styles.businessDayTime, { color: colors.text }]}>
                      {String(editingHour).padStart(2, "0")}:00
                    </Text>
                    <Text style={[styles.businessDayExample, { color: colors.textSecondary }]}>
                      {editingHour === 0
                        ? "00:00 dan 23:59 gacha"
                        : `${String(editingHour).padStart(2, "0")}:00 dan ${String(editingHour - 1 < 0 ? 23 : editingHour - 1).padStart(2, "0")}:59 gacha`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleBusinessDayInc} style={styles.businessDayBtn}>
                    <Text style={[styles.businessDayBtnText, { color: colors.primary }]}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.infoBoxText, { color: colors.text }]}>
                    {editingHour === 0
                      ? `00:00 dan 23:59 gacha. Masalan: ${dayjs().format("DD.MM")} 00:00 dan ${dayjs().add(1, "day").format("DD.MM")} 00:00 gacha bir kun hisoblanadi.`
                      : `${String(editingHour).padStart(2, "0")}:00 dan ${String(editingHour - 1 < 0 ? 23 : editingHour - 1).padStart(2, "0")}:59 gacha.\nMasalan: ${dayjs().add(1, "day").startOf("day").hour(editingHour).format("DD.MM HH:mm")} dan ${dayjs().add(2, "day").startOf("day").hour(editingHour).format("DD.MM HH:mm")} gacha bir kun hisoblanadi.`}
                  </Text>
                </View>
                <Pressable
                  style={[styles.confirmBtn, { backgroundColor: colors.primary, marginTop: SPACING.lg }]}
                  onPress={handleBusinessDaySave}
                >
                  <Text style={[styles.confirmBtnText, { color: colors.white }]}>{t("save")}</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: "row", alignItems: "center", marginRight: 4 },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconContainer: {
    position: "relative",
  },
  lockBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700" },
  modalClose: { fontSize: FONT_SIZE.lg, fontWeight: "600" },
  modalBody: { padding: SPACING.lg },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  pendingBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "500",
    flex: 1,
  },
  section: { marginBottom: SPACING.lg },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  userInfoText: { flex: 1 },
  userName: { fontSize: FONT_SIZE.lg, fontWeight: "700" },
  userRoleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  userRole: { fontSize: FONT_SIZE.sm },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  optionsList: { gap: SPACING.xs },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  optionItemActive: { borderWidth: 1 },
  optionText: { fontSize: FONT_SIZE.lg },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  logoutText: { fontSize: FONT_SIZE.lg, fontWeight: "600" },
  businessDayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  businessDayBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  businessDayBtnText: {
    fontSize: 24,
    fontWeight: "700",
  },
  businessDayTime: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    minWidth: 60,
    textAlign: "center",
  },
  infoBox: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  infoBoxText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  settingDescription: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  businessDayTimeWrap: {
    alignItems: "center",
  },
  businessDayExample: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  confirmModal: {
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  confirmTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  confirmBody: {
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  confirmLabel: {
    fontSize: FONT_SIZE.md,
  },
  confirmValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
  },
  confirmInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  confirmInfoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
  },
  confirmActions: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
  },
});
