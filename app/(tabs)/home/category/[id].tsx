import { useI18n } from "@/shared/i18n/useI18n";
import { getLatestMovies, getPopularMovies } from "@/services/home.service";
import { Movie } from "@/shared/types/movie";
import { NotMovieIcon } from "@/shared/ui/icons/NotMovieIcon";
import { useHomeStore } from "@/store/home.store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { HeroHeader } from "../components/HeroHeader";
import { MovieCard } from "../components/MovieCard";

export default function CategoryPage() {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    id: string;
    title?: string;
  }>();

  const genreId = params.id;
  const categoryTitle =
    params.title ??
    (genreId === "all"
      ? t("search.all")
      : genreId === "popular"
        ? t("home.popular")
        : genreId === "latest"
          ? t("home.latest")
          : "");
  const fetchCategoryMovies = useHomeStore((state) => state.fetchCategoryMovies);
  const categories = useHomeStore((state) => state.categories);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!genreId) return;

    const fetchMovies = async () => {
      try {
        setLoading(true);
        if (genreId === "all") {
          const allMovies = categories.flatMap((category) => category.movies);
          const uniqueMovies = allMovies.filter(
            (movie, index, self) => self.findIndex((item) => item.id === movie.id) === index,
          );
          setMovies(uniqueMovies);
          return;
        }

        if (genreId === "popular") {
          const data = await getPopularMovies(1, 40);
          setMovies(data);
          return;
        }

        if (genreId === "latest") {
          const data = await getLatestMovies(1, 40);
          setMovies(data);
          return;
        }

        const data = await fetchCategoryMovies(genreId);
        setMovies(data);
      } catch (e) {
        console.log("CATEGORY ERROR ❌", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [categories, fetchCategoryMovies, genreId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#101010] justify-center items-center" edges={["top"]}>
        <ActivityIndicator size="large" color="red" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#101010]" edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <HeroHeader />

      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#2C2C2C] items-center justify-center mr-3"
        >
          <ChevronLeft size={20} color="#fff" />
        </Pressable>
        <Text className="text-white text-2xl font-bold flex-1" numberOfLines={1}>
          {categoryTitle}
        </Text>
      </View>

      <FlatList
        data={movies}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: Math.max(90, insets.bottom + 58) }}
        renderItem={({ item }) => (
          <View style={{ width: "45%", minWidth: 150 }}>
            <MovieCard
              movie={item}
              grid
              onPress={() =>
                router.push({
                  pathname: "/movie/[id]",
                  params: { id: item.id },
                })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View className="px-4 py-6 mt-10 flex flex-col items-center justify-center gap-4">
            <NotMovieIcon color="#888" size={40} />
            <Text className="text-gray-400">{t("movie.notFound")}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
