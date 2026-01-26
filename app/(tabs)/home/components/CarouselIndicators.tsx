import { View } from 'react-native'

export function CarouselIndicators({
  length,
  current,
}: {
  length: number
  current: number
}) {
  return (
    <View className="flex-row gap-2 px-4 pb-4">
      {Array.from({ length }).map((_, index) => (
        <View
          key={index}
          className={`h-1 rounded-full ${
            index === current
              ? 'bg-white flex-1'
              : 'bg-white/30 w-12'
          }`}
        />
      ))}
    </View>
  )
}
