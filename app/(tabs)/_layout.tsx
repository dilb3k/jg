import { HomeIcon } from "@/shared/ui/icons/HomeIcon";
import { ReelIcon } from "@/shared/ui/icons/ReelIcon";
import { SearchIcon } from "@/shared/ui/icons/SearchIcon";
import { TVIcon } from "@/shared/ui/icons/TVIcon";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#101010",
          borderTopColor: "#2C2C2C",
          height: 75,
          padding: 10,
        },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#777",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon color={color} filled={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="tv"
        options={{
          title: "TV",
          tabBarIcon: ({ color, focused }) => (
            <TVIcon color={color} filled={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="reels"
        options={{
          title: "Reels",
          tabBarIcon: ({ color, focused }) => (
            <ReelIcon color={color} filled={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <SearchIcon color={color} filled={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
