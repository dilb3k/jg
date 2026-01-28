import { api } from '@/services/api'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Clock, Play, Star } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

const { width, height } = Dimensions.get('window')

interface MovieDetail {
  id: string
  title_uz: string
  title_ru: string
  title_en: string
  year: number
  duration_seconds: number
  age_rating: number
  poster_url: string
  imdb_rating: string
  views_count: number
  description?: string
  genres?: Array<{ id: string; name: string }>
}

export default function MovieDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [movie, setMovie] = useState<MovieDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMovieDetail()
  }, [id])

  const fetchMovieDetail = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/v1/movies/${id}`)
      
      if (response.data.success) {
        setMovie(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching movie:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}ч ${minutes}мин`
    }
    return `${minutes}мин`
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    )
  }

  if (!movie) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <Text className="text-white text-lg">Фильм не найден</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-[#101010]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={{ height: height * 0.7 }} className="relative">
          <Image
            source={{ uri: movie.poster_url }}
            style={{ width: '100%', height: height * 0.7 }}
            resizeMode="cover"
          />
          
          <View className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#101010]" />

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-12 left-4 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="px-4 -mt-20">
          <Text className="text-white text-3xl font-bold mb-3">
            {movie.title_ru || movie.title_uz}
          </Text>

          {/* Stats */}
          <View className="flex-row items-center gap-4 mb-6 flex-wrap">
            <View className="flex-row items-center gap-1">
              <Star color="#FCD34D" fill="#FCD34D" size={18} />
              <Text className="text-white text-base font-semibold">
                {movie.imdb_rating}
              </Text>
            </View>

            <Text className="text-gray-400">•</Text>

            <Text className="text-gray-300 text-base">{movie.year}</Text>

            <Text className="text-gray-400">•</Text>

            <View className="flex-row items-center gap-1">
              <Clock color="#9CA3AF" size={16} />
              <Text className="text-gray-300 text-base">
                {formatDuration(movie.duration_seconds)}
              </Text>
            </View>

            <Text className="text-gray-400">•</Text>

            <Text className="text-gray-300 text-base">{movie.age_rating}+</Text>
          </View>

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <View className="flex-row gap-2 mb-6 flex-wrap">
              {movie.genres.map((genre) => (
                <View
                  key={genre.id}
                  className="bg-white/10 px-3 py-1.5 rounded-full"
                >
                  <Text className="text-white text-sm">{genre.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Watch Button */}
          <TouchableOpacity 
            className="bg-[#FF0000] rounded-lg py-4 flex-row justify-center items-center gap-2 mb-6"
            activeOpacity={0.8}
          >
            <Play color="white" fill="white" size={24} />
            <Text className="text-white text-lg font-semibold">
              Смотреть
            </Text>
          </TouchableOpacity>

          {/* Description */}
          {movie.description && (
            <View className="mb-8">
              <Text className="text-white text-lg font-semibold mb-3">
                Описание
              </Text>
              <Text className="text-gray-300 text-base leading-6">
                {movie.description}
              </Text>
            </View>
          )}

          {/* Views */}
          <View className="mb-8">
            <Text className="text-gray-400 text-sm">
              Просмотров: {movie.views_count?.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}