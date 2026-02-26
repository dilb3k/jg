import { useI18n } from "@/shared/i18n/useI18n";
import { useFavoritesStore } from "@/store/favorites.store";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { RatingIconLeft } from "@/shared/ui/icons/RatingIconLeft";
import { RatingIconRight } from "@/shared/ui/icons/RatingIconRight";
import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const getMovieTitle = (movie: {
  title?: string;
  title_uz?: string;
  title_ru?: string;
  title_en?: string;
}) => movie.title_uz || movie.title_ru || movie.title_en || movie.title || "-";

export default function SavedMoviesScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const items = useFavoritesStore((state) => state.items);
  const loading = useFavoritesStore((state) => state.loading);
  const refreshing = useFavoritesStore((state) => state.refreshing);
  const loadingMore = useFavoritesStore((state) => state.loadingMore);
  const hasNext = useFavoritesStore((state) => state.hasNext);
  const fetchInitial = useFavoritesStore((state) => state.fetchInitial);
  const refresh = useFavoritesStore((state) => state.refresh);
  const fetchMore = useFavoritesStore((state) => state.fetchMore);

  useEffect(() => {
    void fetchInitial();
  }, [fetchInitial]);

  return (
    <SafeAreaView className="flex-1 bg-[#101010]" edges={["top"]}>
      <View className="px-4 flex-row items-center pt-2 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full bg-[#2C2C2C] items-center justify-center"
        >
          <ChevronLeft size={20} color="#fff" />
        </Pressable>

        <Text className="text-white text-lg font-medium flex-1 text-center mr-11">
          {t("profile.saved")}
        </Text>
      </View>

      {loading && items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF0000" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Math.max(100, insets.bottom + 74),
            flexGrow: items.length === 0 ? 1 : undefined,
          }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          refreshing={refreshing}
          onRefresh={refresh}
          onEndReached={() => {
            if (!loadingMore && hasNext) void fetchMore();
          }}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => {
            const ratingValue = Number(item.movie.imdb_rating);
            const showRating = Number.isFinite(ratingValue);
            const isHighRating = showRating && ratingValue >= 8;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                style={{ width: "48%", marginBottom: 18 }}
                onPress={() =>
                  router.push({
                    pathname: "/movie/[id]",
                    params: { id: item.movie.id },
                  })
                }
              >
                <View className="relative">
                  <Image
                    source={{ uri: item.movie.poster_url }}
                    className="w-full aspect-[2/3] rounded-xl bg-[#2C2C2C]"
                    resizeMode="cover"
                  />

                  {showRating ? (
                    isHighRating ? (
                      <View
                        style={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "rgba(0,0,0,0.75)",
                          paddingHorizontal: 7,
                          paddingVertical: 5,
                          borderRadius: 8,
                          gap: 4,
                          borderWidth: 1,
                          borderColor: "rgba(212,175,55,0.55)",
                        }}
                      >
                        <RatingIconLeft size={15} color="#D4AF37" />
                        <Text style={{ color: "#D4AF37", fontSize: 11, fontWeight: "700", letterSpacing: 0.2 }}>
                          {ratingValue.toFixed(1)}
                        </Text>
                        <RatingIconRight size={15} color="#D4AF37" />
                      </View>
                    ) : (
                      <View
                        style={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: "#3D9E4A",
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                          {ratingValue.toFixed(1)}
                        </Text>
                      </View>
                    )
                  ) : null}
                </View>

                <Text className="text-white/85 text-sm mt-2" numberOfLines={1}>
                  {getMovieTitle(item.movie)}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-white/45 text-[30px] text-center leading-9">
                {t("profile.savedEmpty")}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-5">
                <ActivityIndicator color="#FF0000" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
