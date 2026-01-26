import { HomeIcon } from '@/shared/ui/icons/HomeIcon'
import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#111',
          height: 70,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#777',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <HomeIcon color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="tv"
        options={{
          title: 'TV',
          tabBarIcon: ({ color }) => (
            <HomeIcon color={color} /> // keyin TvIcon qilasan
          ),
        }}
      />

      <Tabs.Screen
        name="reels"
        options={{
          title: 'Reels',
          tabBarIcon: ({ color }) => (
            <HomeIcon color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <HomeIcon color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
