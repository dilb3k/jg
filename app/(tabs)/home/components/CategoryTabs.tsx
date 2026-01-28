import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  active: string
  onChange: (id: string) => void
  categories: { id: string; title: string }[]
}

export function CategoryTabs({ active, onChange, categories }: Props) {
  return (
    <View className="bg-[#101010] border-b border-white/5">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3"
        contentContainerStyle={{ gap: 24 }}
      >
        {categories.map((cat) => {
          const isActive = active === cat.id

          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onChange(cat.id)}
              activeOpacity={0.7}
              className="relative"
            >
              <Text
                className={`text-sm ${
                  isActive ? 'text-white font-semibold' : 'text-white/50'
                }`}
              >
                {cat.title}
              </Text>

              {isActive && (
                <View className="absolute -bottom-3 left-0 right-0 h-[2px] bg-red-500 rounded-full" />
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}