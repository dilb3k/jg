import { useEffect, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
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
  Users,
  HandCoins,
  ShoppingCart,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../src/api/client";
import { useAppRefreshStore, useAuthStore } from "../../src/store/selectors";
import { useTheme } from "../../src/store/themeStore";
import { useI18n } from "../../src/i18n";
import { OfflineWarningModal } from "../../src/components/OfflineWarningModal";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";

const TabIcon = ({
  name,
  focused,
  colors,
}: {
  name: string;
  focused: boolean;
  colors: any;
}) => {
  const active = colors.primary;
  const inactive = colors.textTertiary;
  const color = focused ? active : inactive;
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
    case "settings":
      IconComponent = Settings;
      break;
    default:
      IconComponent = Package;
  }

  return (
    <View style={styles.iconContainer}>
      <IconComponent size={size} color={color} />
    </View>
  );
};

function HeaderRefreshButton({ colors, t }: { colors: any; t: any }) {
  const { isLoading, isSyncing, refreshAppData } = useAppRefreshStore();
  const { showToast } = useAppRefreshStore();
  const { setUser } = useAuthStore();

  const loading = isLoading || isSyncing;

  const handleRefresh = async () => {
    if (loading) return;
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
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <RefreshCw size={18} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const userTier = user?.tier ?? "tekin";
  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const { colors } = useTheme();
  const { t } = useI18n();
  const { isLoading, isSyncing } = useAppRefreshStore();
  const { justWentOffline, clearOfflineFlag } = useNetworkStatus();

  const syncing = isLoading || isSyncing;

  useEffect(() => {
    apiClient.setUnauthorizedHandler(() => {
      logout();
      router.replace("/login");
    });
    return () => {
      apiClient.setUnauthorizedHandler(null);
    };
  }, [logout, router]);

  useEffect(() => {
    if (justWentOffline) {
      setShowOfflineWarning(true);
    }
  }, [justWentOffline]);

  const initialRouteName = isSuperAdmin ? "users" : "products";

  return (
    <>
      <Tabs
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: true,
          freezeOnBlur: true,
          lazy: true,
          headerStyle: { backgroundColor: colors.surface, elevation: 0, boxShadow: '0px 0.5px 0px rgba(0,0,0,0.08)' },
          headerTitleStyle: { color: colors.text, fontWeight: "600", fontSize: 17 },
          headerRight: () => (
            <View style={styles.headerRight}>
              <HeaderRefreshButton colors={colors} t={t} />
            </View>
          ),
           tabBarStyle: {
               backgroundColor: colors.surface,
               borderTopColor: colors.border,
               borderTopWidth: 0.5,
              height: 68 + insets.bottom,
              paddingBottom: Math.max(insets.bottom, 8),
              paddingTop: 6,
              elevation: 0,
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
              <TabIcon name="statistics" focused={focused} colors={colors} />
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
        <Tabs.Screen
          name="settings"
          options={{
            title: t("settings"),
            tabBarIcon: ({ focused }) => (
              <TabIcon name="settings" focused={focused} colors={colors} />
            ),
          }}
        />
      </Tabs>

      {syncing && (
        <View style={[styles.syncOverlay, { backgroundColor: colors.overlay }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <OfflineWarningModal
        visible={showOfflineWarning}
        onClose={() => {
          setShowOfflineWarning(false);
          clearOfflineFlag();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: "row", alignItems: "center", marginRight: 4 },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
  },
  iconContainer: {
    position: "relative",
  },
  syncOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
});
