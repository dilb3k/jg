import { View, Text, TouchableOpacity } from 'react-native'
import { Play, Star } from 'lucide-react-native'
import { Movie } from '../index'

export function HeroInfo({ movie }: { movie: Movie }) {
  return (
    <View className="absolute bottom-0 left-0 right-0 p-4 pb-6">
      <Text className="text-white text-4xl font-bold mb-2">
        {movie.title_ru}
      </Text>

      <View className="flex-row items-center gap-3 mb-2">
        <View className="flex-row items-center gap-1">
          <Star color="#FCD34D" fill="#FCD34D" size={16} />
          <Text className="text-gray-300 text-sm">{movie.imdb_rating}</Text>
        </View>

        <Text className="text-gray-300 text-sm">
          с {movie.year}, детектив, триллер
        </Text>

        <Text className="text-gray-300 text-sm">
          {movie.age_rating}+
        </Text>
      </View>

      <TouchableOpacity className="bg-[#FF0000] rounded-lg py-4 flex-row justify-center items-center gap-2 mb-3">
        <Play color="white" fill="white" size={20} />
        <Text className="text-white text-lg font-semibold">
          Смотреть сериал
        </Text>
      </TouchableOpacity>
    </View>
  )
}
