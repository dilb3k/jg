import { Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BarChart3, ClipboardList, Package, RefreshCw, Trophy } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../src/constants';
import { useAppRefreshStore } from '../../src/store/selectors';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconColor = focused ? COLORS.primary : COLORS.textTertiary;

  const renderIcon = () => {
    switch (name) {
      case 'products':
        return <Package size={20} color={iconColor} />;
      case 'inventory':
        return <ClipboardList size={20} color={iconColor} />;
      case 'statistics':
        return <BarChart3 size={20} color={iconColor} />;
      case 'rating':
        return <Trophy size={20} color={iconColor} />;
      default:
        return <Package size={20} color={iconColor} />;
    }
  };

  return (
    <View style={styles.tabIconContainer}>
      {renderIcon()}
    </View>
  );
}

function HeaderRefreshButton() {
  const { isLoading, refreshAppData, showToast } = useAppRefreshStore();

  const handleRefresh = async () => {
    if (isLoading) return;

    try {
      await refreshAppData();
      showToast("Ma'lumotlar yangilandi", 'success');
    } catch {
      showToast("Yangilashda xatolik yuz berdi", 'error');
    }
  };

  return (
    <TouchableOpacity
      style={styles.refreshButton}
      onPress={handleRefresh}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <RefreshCw size={18} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        freezeOnBlur: true,
        lazy: true,
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: { color: COLORS.text, fontWeight: '600' },
        headerRight: () => <HeaderRefreshButton />,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mahsulotlar',
          tabBarIcon: ({ focused }) => <TabIcon name="products" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Ombor',
          tabBarIcon: ({ focused }) => <TabIcon name="inventory" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistika',
          tabBarIcon: ({ focused }) => <TabIcon name="statistics" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rating"
        options={{
          title: 'Reyting',
          tabBarIcon: ({ focused }) => <TabIcon name="rating" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
