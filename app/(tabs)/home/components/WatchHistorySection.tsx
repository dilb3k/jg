import { useRouter } from 'expo-router'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { WatchHistoryItem } from '@/shared/types/watch-history'
import { MovieCard } from './MovieCard'

export function WatchHistorySection({
  items,
}: {
  items: WatchHistoryItem[]
}) {
  const router = useRouter()

  if (!items.length) return null

  return (
    <View className="mb-8">
      <Text className="text-white text-xl font-semibold px-4 mb-3">
        Davom ettirish
      </Text>

      <ScrollView horizontal className="px-4">
        {items.map((item) => (
          <MovieCard
            key={item.id}
            movie={{
              id: item.content_id,
              poster_url: item.poster_url,
              imdb_rating: `${item.progress_percent}%`,
            } as any}
            onPress={() =>
              router.push({
                pathname: '/movie/[id]',
                params: { id: item.content_id },
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  )
}
