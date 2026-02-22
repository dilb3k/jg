import { Movie } from '@/shared/types/movie'
import { useI18n } from '@/shared/i18n/useI18n'
import { Play, Star } from 'lucide-react-native'
import { Text, TouchableOpacity, View } from 'react-native'

interface Props {
  movie: Movie
  onWatchPress: () => void
}

export function HeroInfo({ movie, onWatchPress }: Props) {
  const { t } = useI18n()

  return (
    <View className="absolute bottom-0 left-0 right-0 p-4 pb-6">
      <Text className="text-white text-4xl font-bold mb-2" numberOfLines={2}>
        {movie.title_ru || movie.title_uz}
      </Text>

      <View className="flex-row items-center gap-3 mb-4 flex-wrap">
        <View className="flex-row items-center gap-1">
          <Star color="#FCD34D" fill="#FCD34D" size={16} />
          <Text className="text-gray-300 text-sm font-medium">
            {movie.imdb_rating}
          </Text>
        </View>

        <Text className="text-gray-300 text-sm">{movie.year}</Text>
        <Text className="text-gray-300 text-sm">{movie.age_rating}+</Text>
      </View>

      <TouchableOpacity
        className="bg-[#FF0000] rounded-lg py-4 flex-row justify-center items-center gap-2"
        onPress={onWatchPress}
        activeOpacity={0.8}
      >
        <Play color="white" fill="white" size={20} />
        <Text className="text-white text-lg font-semibold">
          {t("reels.watch")}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
