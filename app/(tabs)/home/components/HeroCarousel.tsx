import { useRouter } from 'expo-router'
import { Dimensions, Image, TouchableOpacity, View } from 'react-native'
import { CarouselIndicators } from './CarouselIndicators'
import { HeroHeader } from './HeroHeader'
import { HeroInfo } from './HeroInfo'

const { height } = Dimensions.get('window')

export function HeroCarousel({
  carousel,
  index,
  total,
}: {
  carousel: any
  index: number
  total: number
}) {
  const router = useRouter()

  const handleOpenMovie = () => {
    router.push({
      pathname: '/movie/[id]',
      params: {
        id: carousel.movie.id, // 🔥 SHU MUHIM
      },
    })
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleOpenMovie}
      style={{ height: height * 0.85 }}
      className="relative"
    >
      <Image
        source={{ uri: carousel.poster_url }}
        style={{ width: '100%', height: height * 0.85 }}
        resizeMode="cover"
      />

      <View className="absolute inset-0 bg-black/60" />

      <HeroHeader />

      <HeroInfo
        movie={carousel.movie}
        onWatchPress={handleOpenMovie}
      />

      <View className="absolute bottom-[-10px] left-0 right-0">
        <CarouselIndicators length={total} current={index} />
      </View>
    </TouchableOpacity>
  )
}
