import { Pressable, View } from 'react-native'

export function CarouselIndicators({
  length,
  current,
  onSelect,
}: {
  length: number
  current: number
  onSelect?: (index: number) => void
}) {
  return (
    <View className="w-full flex-row items-center px-0">
      {Array.from({ length }).map((_, index) => (
        <Pressable
          key={index}
          onPress={() => onSelect?.(index)}
          hitSlop={6}
          style={{
            height: 6,
            borderRadius: 999,
            flex: index === current ? 1 : 0.2,
            marginHorizontal: 4,
            backgroundColor: index === current ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
          }}
        />
      ))}
    </View>
  )
}
