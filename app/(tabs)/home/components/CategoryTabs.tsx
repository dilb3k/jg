import { View, Text, ScrollView, TouchableOpacity } from 'react-native'

interface Props {
  active: string
  onChange: (slug: string) => void
  categories: { id: string; title: string }[]
}

export function CategoryTabs({ active, onChange, categories }: Props) {
  return (
    <View className="bg-[#101010] px-4 py-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((cat) => {
          const isActive = active === cat.id

          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onChange(cat.id)}
              className="mr-6"
            >
              <Text
                className={`text-sm ${
                  isActive ? 'text-white font-semibold' : 'text-white/50'
                }`}
              >
                {cat.title}
              </Text>

              {isActive && (
                <View className="h-[2px] bg-red-500 mt-1 rounded-full" />
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}
