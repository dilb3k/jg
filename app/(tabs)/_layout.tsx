import { useState } from "react";
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
  RefreshCw,
  Settings,
  LogOut,
  User,
  Globe,
  Moon,
  Sun,
  Users,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppRefreshStore, useAuthStore } from "../../src/store/selectors";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import { SPACING, FONT_SIZE, BORDER_RADIUS } from "../../src/theme";

const LANGUAGES = [
  { code: "uz", label: "O'zbek" },
  { code: "ru", label: "Русский" },
];

const THEMES = [
  { code: "light", labelKey: "light", icon: Sun },
  { code: "dark", labelKey: "dark", icon: Moon },
];

function TabIcon({ name, focused, colors }: { name: string; focused: boolean; colors: any }) {
  const iconColor = focused ? colors.primary : colors.textTertiary;

  const renderIcon = () => {
    switch (name) {
      case "restock":
        return <Package size={24} color={iconColor} />;
      case "inventory":
        return <ClipboardList size={24} color={iconColor} />;
      case "statistics":
        return <BarChart3 size={24} color={iconColor} />;
      case "users":
        return <Users size={24} color={iconColor} />;
      default:
        return <Package size={24} color={iconColor} />;
    }
  };

  return (
    <View style={styles.tabIconContainer}>
      {renderIcon()}
    </View>
  );
}

function HeaderRefreshButton({ colors }: { colors: any }) {
  const { isLoading, refreshAppData, showToast } = useAppRefreshStore();

  const handleRefresh = async () => {
    if (isLoading) return;

    try {
      await refreshAppData();
      showToast("Ma'lumotlar yangilandi", "success");
    } catch {
      showToast("Yangilashda xatolik yuz berdi", "error");
    }
  };

  return (
    <TouchableOpacity
      style={[styles.refreshButton, { backgroundColor: colors.background, borderColor: colors.border }]}
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

function HeaderSettingsButton({ onPress, colors }: { onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      style={[styles.settingsButton, { backgroundColor: colors.background, borderColor: colors.border }]}
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
  
  // Theme and i18n integration - use selectors to avoid side effects
  const { theme, isDark, setTheme, language, setLanguage, colors } = useTheme();
  const { t } = useI18n();

  const handleLogout = async () => {
    await logout();
    setShowSettings(false);
    router.replace("/login");
  };

  const handleLanguageChange = async (code: "uz" | "ru") => {
    await setLanguage(code);
    setShowSettings(false);
  };

  const handleThemeChange = (code: "light" | "dark") => {
    setTheme(code);
    setShowSettings(false);
  };

  const isSuperAdmin = user?.role === "superAdmin";

  // Get theme labels from translations
  const getThemeLabel = (key: string) => {
    return key === "light" ? "Yorug'" : "Tungi";
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          freezeOnBlur: true,
          lazy: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text, fontWeight: "600" },
          headerRight: () => (
            <View style={styles.headerRight}>
              <HeaderRefreshButton colors={colors} />
              <HeaderSettingsButton onPress={() => setShowSettings(true)} colors={colors} />
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
          name="restock"
          options={{
            title: t("main"),
            tabBarIcon: ({ focused }) => <TabIcon name="restock" focused={focused} colors={colors} />,
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: t("inventory"),
            tabBarIcon: ({ focused }) => <TabIcon name="inventory" focused={focused} colors={colors} />,
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: t("statistics"),
            tabBarIcon: ({ focused }) => <TabIcon name="statistics" focused={focused} colors={colors} />,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: t("users"),
            href: isSuperAdmin ? undefined : null,
            tabBarIcon: ({ focused }) => <TabIcon name="users" focused={focused} colors={colors} />,
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
            onPress={(event) => event.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("settings")}</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>{t("close")}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* User Info */}
              {user && (
                <View style={styles.section}>
                  <View style={[styles.userInfo, { backgroundColor: colors.background }]}>
                    <User size={20} color={colors.textSecondary} />
                    <View style={styles.userInfoText}>
                      <Text style={[styles.userName, { color: colors.text }]}>{user.username}</Text>
                      <Text style={[styles.userRole, { color: colors.textSecondary }]}>
                        {user.role === "superAdmin" ? t("superAdmin") : t("admin")}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Language */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Globe size={18} color={colors.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t("language")}</Text>
                </View>
                <View style={styles.optionsList}>
                  {LANGUAGES.map((lang) => (
                    <Pressable
                      key={lang.code}
                      style={[
                        styles.optionItem,
                        language === lang.code && [styles.optionItemActive, { borderColor: colors.primary, backgroundColor: colors.primary + "15" }],
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() => handleLanguageChange(lang.code as "uz" | "ru")}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.text },
                          language === lang.code && { color: colors.primary, fontWeight: "600" },
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
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t("theme")}</Text>
                </View>
                <View style={styles.optionsList}>
                  {THEMES.map((t_item) => (
                    <Pressable
                      key={t_item.code}
                      style={[
                        styles.optionItem,
                        theme === t_item.code && [styles.optionItemActive, { borderColor: colors.primary, backgroundColor: colors.primary + "15" }],
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() => handleThemeChange(t_item.code as "light" | "dark")}
                    >
                      <t_item.icon size={18} color={theme === t_item.code ? colors.primary : colors.textSecondary} />
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.text },
                          theme === t_item.code && { color: colors.primary, fontWeight: "600" },
                        ]}
                      >
                        {getThemeLabel(t_item.labelKey)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Logout */}
              <View style={styles.section}>
                <Pressable
                  style={[styles.logoutButton, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}
                  onPress={handleLogout}
                >
                  <LogOut size={18} color={colors.danger} />
                  <Text style={[styles.logoutText, { color: colors.danger }]}>{t("logout")}</Text>
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
  },
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
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
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
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
  },
  modalClose: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
  },
  modalBody: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
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
  userInfoText: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
  },
  userRole: {
    fontSize: FONT_SIZE.sm,
  },
  optionsList: {
    gap: SPACING.xs,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  optionItemActive: {
    borderWidth: 1,
  },
  optionText: {
    fontSize: FONT_SIZE.lg,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
  },
});