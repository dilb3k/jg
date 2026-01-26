import { Image, TouchableOpacity, View } from 'react-native'

export function HeroHeader() {
  return (
    <View className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-4 pt-12">
      <TouchableOpacity>
        <Image
          source={{ uri: 'https://via.placeholder.com/100/4a5568/ffffff?text=U' }}
          className="w-12 h-12 rounded-full border-2 border-white/20"
        />
      </TouchableOpacity>

      {/* vaqtincha icon o‘rniga nuqta */}
      <View className="w-6 h-6 rounded-full bg-white/20" />
    </View>
  )
}
