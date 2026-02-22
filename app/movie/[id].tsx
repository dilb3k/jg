import { useI18n } from "@/shared/i18n/useI18n";
import { NotMovieIcon } from "@/shared/ui/icons/NotMovieIcon";
import { useMovieStore } from "@/store/movie.store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MovieDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, language } = useI18n();

  const movie = useMovieStore((state) => state.movie);
  const loading = useMovieStore((state) => state.loading);
  const fetchMovie = useMovieStore((state) => state.fetchMovie);
  const clear = useMovieStore((state) => state.clear);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchMovie(id);

    return () => {
      clear();
    };
  }, [clear, fetchMovie, id]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center px-6">
        <NotMovieIcon color="#888" size={40} />
        <Text className="text-gray-400 mt-4">{t("common.noData")}</Text>
      </View>
    );
  }

  const title =
    language === "uz"
      ? movie.title_uz || movie.title_ru || movie.title_en
      : language === "en"
        ? movie.title_en || movie.title_ru || movie.title_uz
        : movie.title_ru || movie.title_uz || movie.title_en;

  const description =
    language === "uz"
      ? movie.description_uz || movie.description_ru || movie.description_en
      : language === "en"
        ? movie.description_en || movie.description_ru || movie.description_uz
        : movie.description_ru || movie.description_uz || movie.description_en;

  return (
    <View className="flex-1 bg-[#101010]">
      <StatusBar barStyle="light-content" />

      <TouchableOpacity
        className="absolute top-12 left-4 z-50 bg-black/60 p-2 rounded-full"
        onPress={handleGoBack}
      >
        <ArrowLeft color="white" size={20} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Image
          source={{ uri: movie.poster_url }}
          className="w-full h-[520px]"
          resizeMode="cover"
        />

        <View className="px-4 py-4">
          <Text className="text-white text-2xl font-bold">{title}</Text>

          <View className="flex-row items-center mt-2 gap-4">
            {movie.imdb_rating ? (
              <Text className="text-yellow-400">⭐ {movie.imdb_rating}</Text>
            ) : null}
            {movie.year ? <Text className="text-white/50">{movie.year}</Text> : null}
            {movie.age_rating ? (
              <Text className="text-white/50">{movie.age_rating}+</Text>
            ) : null}
          </View>

          {description ? (
            <Text className="text-white/80 mt-4 leading-6">{description}</Text>
          ) : null}
        </View>
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.8}
        className="absolute bottom-6 left-4 right-4 bg-red-600 rounded-xl py-4 z-50"
      >
        <Text className="text-white text-center font-semibold text-base">
          ▶ {t("reels.watch")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
