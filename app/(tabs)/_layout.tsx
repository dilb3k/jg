import { HomeIcon } from '@/shared/ui/icons/HomeIcon'
import { ReelIcon } from '@/shared/ui/icons/ReelIcon'
import { SearchIcon } from '@/shared/ui/icons/SearchIcon'
import { TVIcon } from '@/shared/ui/icons/TVIcon'
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
            <TVIcon color={color} /> 
          ),
        }}
      />

      <Tabs.Screen
        name="reels"
        options={{
          title: 'Reels',
          tabBarIcon: ({ color }) => (
            <ReelIcon color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <SearchIcon color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
