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
  return (
    <View style={{ height: height * 0.85 }} className="relative">
      <Image
        source={{ uri: carousel.poster_url }}
        style={{ width: '100%', height: height * 0.85 }}
        className="absolute inset-0"
        resizeMode="cover"
      />

      <View className="absolute inset-0 bg-black/40" />

      <HeroHeader />
      <HeroInfo movie={carousel.movie} />
      <CarouselIndicators length={total} current={index} />
    </View>
  )
}
