import { View, Image, Text, TouchableOpacity } from 'react-native'
import { Star } from 'lucide-react-native'
import { Movie } from '../index'

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <TouchableOpacity className="mr-3">
      <Image
        source={{ uri: movie.poster_url }}
        className="w-32 h-48 rounded-lg"
      />
      <View className="flex-row items-center gap-1 mt-2">
        <Star size={12} color="#FCD34D" fill="#FCD34D" />
        <Text className="text-white text-xs">{movie.imdb_rating}</Text>
      </View>
    </TouchableOpacity>
  )
}
