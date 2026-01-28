import { useRouter } from 'expo-router'
import { ScrollView, Text, View } from 'react-native'
import { Category } from '../index'
import { MovieCard } from './MovieCard'

interface Props {
  category: Category
  onLayout: (y: number) => void
}

export function CategorySection({ category, onLayout }: Props) {
  const router = useRouter()

  const handleMoviePress = (movieId: string) => {
    router.push(`/movie/${movieId}`)
  }

  return (
    <View
      className="mb-6"
      onLayout={(event) => {
        const { y } = event.nativeEvent.layout
        onLayout(y)
      }}
    >
      <Text className="text-white text-xl font-semibold px-4 mb-3">
        {category.title}
      </Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        className="px-4"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {category.movies.map((movie) => (
          <MovieCard 
            key={movie.id} 
            movie={movie}
            onPress={() => handleMoviePress(movie.id)}
          />
        ))}
      </ScrollView>
    </View>
  )
}