import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  Text,
  View,
} from "react-native";

import { api } from "@/services/api";
import { Movie } from "@/shared/types/movie";
import { NotMovieIcon } from "@/shared/ui/icons/NotMovieIcon";
import { HeroHeader } from "../components/HeroHeader";
import { MovieCard } from "../components/MovieCard";

export default function CategoryPage() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id: string;
    title?: string;
  }>();

  const genreId = params.id;
  const categoryTitle = params.title ?? "";

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!genreId) return;

    const fetchMovies = async () => {
      try {
        setLoading(true);

        const res = await api.get(
          `/api/v1/movies/by-genre/${genreId}?page=1&per_page=20`,
        );

        if (res.data?.success) {
          const data = res.data.data;
          setMovies(Array.isArray(data) ? data : (data.items ?? []));
        }
      } catch (e) {
        console.log("CATEGORY ERROR ❌", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [genreId]);

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
            onPress={() => router.push(`/movie/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View className="px-4 py-6 mt-10 flex flex-col items-center justify-center gap-4">
            <NotMovieIcon color="#888" size={40} />
            <Text className="text-gray-400">Filmlar topilmadi</Text>
          </View>
        }
      />
    </View>
  );
}
