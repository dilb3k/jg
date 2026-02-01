import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Props {
  active: string;
  categories: { id: string; title: string }[];
}

export function CategoryTabs({ active, categories }: Props) {
  const router = useRouter();

  return (
    <View className="bg-[#101010] border-b border-white/5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="p-4"
        contentContainerStyle={{ gap: 16 }}
      >
        {categories.map((cat) => {
          const isActive = active === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/home/category/[id]",
                  params: { id: cat.id, title: cat.title },
                })
              }
              className={`px-4 py-2 rounded-full ${
                isActive ? "bg-white/10" : "bg-transparent"
              }`}
            >
              <Text
                className={`text-sm ${
                  isActive ? "text-white font-semibold" : "text-white/50"
                }`}
              >
                {cat.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
