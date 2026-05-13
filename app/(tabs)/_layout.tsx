import { useEffect, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  ActivityIndicator,
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
  Star,
  Wifi,
  WifiOff,
  Lock,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient, setConnectionMode as setApiConnectionMode } from "../../src/api/client";
import { useAppRefreshStore, useAuthStore } from "../../src/store/selectors";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import { SPACING, FONT_SIZE, BORDER_RADIUS } from "../../src/theme";

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
  const color = isLocked ? colors.textTertiary : (focused ? colors.primary : colors.textTertiary);
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
    case "rating":
      IconComponent = Star;
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

  const handleRefresh = async () => {
    if (isLoading) return;
    try {
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

  const { theme, isDark, setTheme, language, setLanguage, connectionMode, setConnectionMode, colors } = useTheme();
  const { t } = useI18n();

  const LANGUAGES = [
    { code: "uz", label: t("lang_uz") },
    { code: "ru", label: t("lang_ru") },
  ];

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

  const initialRouteName = isSuperAdmin ? "users" : "index";

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
            title: t("restock"),
            href: isSuperAdmin ? null : undefined,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="index" focused={focused} colors={colors} />
            ),
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
          name="rating"
          options={{
            title: t("rating"),
            href: isSuperAdmin ? null : undefined,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="rating" focused={focused} colors={colors} isLocked={!isPayed} />
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
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
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
});
