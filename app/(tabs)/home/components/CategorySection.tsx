import { View, Text, ScrollView } from 'react-native'
import { Category } from '../index'
import { MovieCard } from './MovieCard'

export function CategorySection({ category }: { category: Category }) {
  return (
    <View className="mb-6">
      <Text className="text-white text-xl font-semibold px-4 mb-3">
        {category.title}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
        {category.movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </ScrollView>
    </View>
  )
}
