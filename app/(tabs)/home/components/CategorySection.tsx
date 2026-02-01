import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { Movie } from "@/shared/types/movie";
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

  return (
    <View className="mb-6" onLayout={(e) => onLayout(e.nativeEvent.layout.y)}>
      <TouchableOpacity
        className="px-4 mb-3"
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/home/category/[id]",
            params: { id: category.id, title: category.title },
          })
        }
      >
        <Text className="text-white text-xl font-semibold">
          {category.title}
        </Text>
      </TouchableOpacity>

      {category.movies.length === 0 ? (
        <View className="px-4 py-6">
          <Text className="text-gray-400 flex flex-col items-center justify-center gap-4">
            <NotMovieIcon color="#888" size={40} />
            Bu Janrda Film Yoq
          </Text>
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
              onPress={() => router.push(`/movie/${movie.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
