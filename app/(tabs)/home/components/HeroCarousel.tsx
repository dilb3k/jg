import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import { CarouselIndicators } from './CarouselIndicators'
import { HeroInfo } from './HeroInfo'

const { height } = Dimensions.get('window')

export function HeroCarousel({
  carousel,
  index,
  total,
  onSelect,
}: {
  carousel: any
  index: number
  total: number
  onSelect?: (index: number) => void
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
    <View style={{ height: height * 0.65 }} className="relative">
      <TouchableOpacity activeOpacity={0.9} onPress={handleOpenMovie} style={StyleSheet.absoluteFillObject}>
        <Image
          source={{ uri: carousel.poster_url }}
          style={{ width: '100%', height: height * 0.65 }}
          resizeMode="cover"
        />

        <View style={StyleSheet.absoluteFillObject} className="bg-black/20" />
        <LinearGradient
          colors={['rgba(1,1,1,0)', 'rgba(1,1,1,0.04)', 'rgba(1,1,1,0.16)', 'rgba(1,1,1,0.38)', 'rgba(1,1,1,0.68)', '#010101']}
          locations={[0, 0.2, 0.45, 0.67, 0.86, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: height * 0.48,
            zIndex: 1,
          }}
        />

        <View style={{ zIndex: 3 }}>
          <HeroInfo
            movie={carousel.movie}
            onWatchPress={handleOpenMovie}
          />
        </View>
      </TouchableOpacity>

      <View className="absolute bottom-1 left-0 right-0 px-4 z-20">
        <CarouselIndicators length={total} current={index} onSelect={onSelect} />
      </View>
    </View>
  )
}
