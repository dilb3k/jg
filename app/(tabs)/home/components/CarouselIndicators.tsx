import { View } from 'react-native'

export function CarouselIndicators({
  length,
  current,
}: {
  length: number
  current: number
}) {
  return (
    <View className="absolute bottom-4 left-0 right-0 flex-row items-center justify-center gap-2 px-4">
      {Array.from({ length }).map((_, index) => (
        <View
          key={index}
          className={`h-1.5 rounded-full ${
            index === current
              ? 'bg-white w-7'
              : 'bg-white/35 w-2.5'
          }`}
        />
      ))}
    </View>
  )
}
