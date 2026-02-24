import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Props {
  active: string;
  categories: { id: string; title: string }[];
  onChange?: (categoryId: string) => void;
}

export function CategoryTabs({ active, categories, onChange }: Props) {
  const router = useRouter();

  return (
    <View className="bg-[#101010] border-b border-white/10">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-2"
        contentContainerStyle={{ gap: 8, alignItems: "center" }}
      >
        {categories.map((cat) => {
          const isActive = active === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => {
                if (onChange) {
                  onChange(cat.id);
                  return;
                }

                router.push({
                  pathname: "/(tabs)/home/category/[id]",
                  params: { id: cat.id, title: cat.title },
                });
              }}
              className={`px-4 h-9 rounded-lg items-center justify-center ${
                isActive ? "bg-[#2C2C2C]" : "bg-transparent"
              }`}
            >
              <Text className={`text-sm ${isActive ? "text-white" : "text-white/55"}`}>{cat.title}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
