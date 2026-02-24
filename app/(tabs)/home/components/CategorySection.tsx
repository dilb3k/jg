import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { useI18n } from "@/shared/i18n/useI18n";
import { Movie } from "@/shared/types/movie";
import { ForwardIcon } from "@/shared/ui/icons/ForwardIcon";
import { NotMovieIcon } from "@/shared/ui/icons/NotMovieIcon";
import { MovieCard } from "./MovieCard";

interface Category {
  id: string;
  title: string;
  movies: Movie[];
}

interface Props {
  category: Category;
  onLayout: (y: number) => void;
}

export function CategorySection({ category, onLayout }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const openCategory = () =>
    router.push({
      pathname: "/(tabs)/home/category/[id]",
      params: { id: category.id, title: category.title },
    });

  return (
    <View className="my-4" onLayout={(e) => onLayout(e.nativeEvent.layout.y)}>
      <View className="px-4 mb-3 flex-row items-center justify-between">
        <TouchableOpacity activeOpacity={0.75} onPress={openCategory}>
          <Text className="text-white text-[22px] font-semibold">{category.title}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={openCategory}
        >
          <View className="flex-row items-center gap-1">
            <Text className="text-white/45 text-sm">{t("search.all")}</Text>
            <ForwardIcon color="#8A8A8A" size={14} />
          </View>
        </TouchableOpacity>
      </View>

      {category.movies.length === 0 ? (
        <View className="px-4 py-6 items-center justify-center gap-3">
          <NotMovieIcon color="#888" size={36} />
          <Text className="text-gray-400">{t("home.emptyCategory")}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {category.movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onPress={() =>
                router.push({
                  pathname: "/movie/[id]",
                  params: { id: movie.id },
                })
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
