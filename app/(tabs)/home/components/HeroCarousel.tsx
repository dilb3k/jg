import { useRouter } from 'expo-router'
import { Dimensions, Image, View } from 'react-native'
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

  // const handleWatchPress = () => {
  //   router.push(`/movie/${carousel.movie.id}`)
  // }

  return (
    <View style={{ height: height * 0.85 }} className="relative">
      <Image
        source={{ uri: carousel.poster_url }}
        style={{ width: '100%', height: height * 0.85 }}
        className="absolute inset-0"
        resizeMode="cover"
      />

      {/* Dark gradient overlay */}
      <View className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />

      <HeroHeader />
      <HeroInfo
        movie={carousel.movie}
        // onWatchPress={handleWatchPress}
      />
      <View className='absolute bottom-[-10px] left-0 right-0'>
        <CarouselIndicators length={total} current={index} />
      </View>
    </View>
  )
}