import { useI18n } from "@/shared/i18n/useI18n";
import { HomeIcon } from "@/shared/ui/icons/HomeIcon";
import { ReelIcon } from "@/shared/ui/icons/ReelIcon";
import { SearchIcon } from "@/shared/ui/icons/SearchIcon";
import { TVIcon } from "@/shared/ui/icons/TVIcon";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#101010",
          borderTopColor: "#2C2C2C",
          height: 78,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#777",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon color={color} filled={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="tv"
        options={{
          title: t("tabs.tv"),
          tabBarIcon: ({ color, focused }) => (
            <TVIcon color={color} filled={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="reels"
        options={{
          title: t("tabs.reels"),
          tabBarIcon: ({ color, focused }) => (
            <ReelIcon color={color} filled={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: t("tabs.search"),
          tabBarIcon: ({ color, focused }) => (
            <SearchIcon color={color} filled={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
