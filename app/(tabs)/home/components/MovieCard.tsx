import { Movie } from '@/shared/types/movie'
import { Star } from 'lucide-react-native'
import { Image, Text, TouchableOpacity, View } from 'react-native'

interface Props {
  movie: Movie
  onPress?: () => void // 🔥 optional
}

export function MovieCard({ movie, onPress }: Props) {
  return (
    <TouchableOpacity
      className="mr-3"
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <Image
        source={{ uri: movie.poster_url }}
        className="w-32 h-48 rounded-lg"
        resizeMode="cover"
      />

      <View className="flex-row items-center gap-1 mt-2">
        <Star size={12} color="#FCD34D" fill="#FCD34D" />
        <Text className="text-white text-xs font-medium">
          {movie.imdb_rating ?? '—'}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
