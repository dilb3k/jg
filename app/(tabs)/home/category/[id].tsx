import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useHomeStore } from "@/store/home.store";
import { useI18n } from "@/shared/i18n/useI18n";
import { Movie } from "@/shared/types/movie";
import { NotMovieIcon } from "@/shared/ui/icons/NotMovieIcon";
import { HeroHeader } from "../components/HeroHeader";
import { MovieCard } from "../components/MovieCard";

export default function CategoryPage() {
  const router = useRouter();
  const { t } = useI18n();

  const params = useLocalSearchParams<{
    id: string;
    title?: string;
  }>();

  const genreId = params.id;
  const categoryTitle = params.title ?? "";
  const fetchCategoryMovies = useHomeStore((state) => state.fetchCategoryMovies);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!genreId) return;

    const fetchMovies = async () => {
      try {
        setLoading(true);
        const data = await fetchCategoryMovies(genreId);
        setMovies(data);
      } catch (e) {
        console.log("CATEGORY ERROR ❌", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [fetchCategoryMovies, genreId]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#101010]">
      <StatusBar barStyle="light-content" />
      <HeroHeader />

      {categoryTitle && (
        <Text className="text-white text-2xl font-bold px-4 pt-32 pb-2">
          {categoryTitle}
        </Text>
      )}

      <FlatList
        data={movies}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <MovieCard
            movie={item}
            onPress={() =>
              router.push({
                pathname: "/movie/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View className="px-4 py-6 mt-10 flex flex-col items-center justify-center gap-4">
            <NotMovieIcon color="#888" size={40} />
            <Text className="text-gray-400">{t("movie.notFound")}</Text>
          </View>
        }
      />
    </View>
  );
}
