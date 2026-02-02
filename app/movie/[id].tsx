import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { api } from "@/services/api";
import { Movie } from "@/shared/types/movie";
import { NotMovieIcon } from "@/shared/ui/icons/NotMovieIcon";
import { ArrowLeft } from "lucide-react-native";

export default function MovieDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  const handeGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchMovie = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/v1/movies/${id}`);
        if (res.data?.success) setMovie(res.data.data);
      } catch (e) {
        console.log("MOVIE DETAIL ERROR ❌", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <Text className="text-gray-400 flex flex-col items-center justify-center gap-4">
          <NotMovieIcon color="#888" size={40} />
          Filmlar topilmadi
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#101010]">
      <StatusBar barStyle="light-content" />

      {/* BACK BUTTON */}
      <TouchableOpacity
        className="absolute top-12 left-4 z-50 bg-black/60 p-2 rounded-full"
        onPress={handeGoBack}
      >
        <ArrowLeft color="white" size={20} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* POSTER */}
        <Image
          source={{ uri: movie.poster_url }}
          className="w-full h-[520px]"
          resizeMode="cover"
        />

        {/* CONTENT */}
        <View className="px-4 py-4">
          <Text className="text-white text-2xl font-bold">
            {movie.title_uz}
          </Text>

          <View className="flex-row items-center mt-2 gap-4">
            {movie.imdb_rating && (
              <Text className="text-yellow-400">⭐ {movie.imdb_rating}</Text>
            )}
            {movie.year && <Text className="text-white/50">{movie.year}</Text>}
            {movie.age_rating && (
              <Text className="text-white/50">{movie.age_rating}+</Text>
            )}
          </View>

          {"description_uz" in movie && (
            <Text className="text-white/80 mt-4 leading-6">
              {(movie as any).description_uz}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* WATCH BUTTON */}
      <TouchableOpacity
        activeOpacity={0.8}
        className="absolute bottom-6 left-4 right-4 bg-red-600 rounded-xl py-4 z-50"
      >
        <Text className="text-white text-center font-semibold text-base">
          ▶ Tomosha qilish
        </Text>
      </TouchableOpacity>
    </View>
  );
}
