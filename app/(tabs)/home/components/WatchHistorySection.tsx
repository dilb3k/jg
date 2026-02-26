import { useI18n } from "@/shared/i18n/useI18n";
import { WatchHistoryItem } from "@/shared/types/watch-history";
import { calculateProgressPercent, formatDurationHM } from "@/shared/utils/time";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { RatingIconLeft } from "@/shared/ui/icons/RatingIconLeft";
import { RatingIconRight } from "@/shared/ui/icons/RatingIconRight";

export function WatchHistorySection({ items }: { items: WatchHistoryItem[] }) {
  const router = useRouter();
  const { t, language } = useI18n();
  const { width } = useWindowDimensions();

  if (!items.length) return null;
  const cardWidth = Math.max(width - 32, 280);
  const posterHeight = Math.round(cardWidth * 0.58);

  const resolveTitle = (item: WatchHistoryItem) => {
    if (language === "uz") return item.title_uz || item.title_ru || item.title_en || "-";
    if (language === "en") return item.title_en || item.title_ru || item.title_uz || "-";
    return item.title_ru || item.title_uz || item.title_en || "-";
  };

  const getRemainingDuration = (item: WatchHistoryItem) => {
    const remain = Math.max(item.total_duration_seconds - item.last_position_seconds, 0);
    return formatDurationHM(remain, language);
  };

  return (
    <View className="mb-7">
      <Text className="text-white text-[22px] font-semibold px-4 mb-3">
        {t("home.continueWatching")}
      </Text>

      <ScrollView horizontal className="px-4" showsHorizontalScrollIndicator={false}>
        {items.map((item) => {
          const ratingValue = Number(item.imdb_rating);
          const showRating = Number.isFinite(ratingValue);
          const isHighRating = showRating && ratingValue > 8;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              className="mr-3"
              onPress={() =>
                router.push({
                  pathname: "/movie/[id]",
                  params: { id: item.content_id },
                })
              }
            >
              <View style={{ width: cardWidth }}>
                <View className="relative rounded-2xl overflow-hidden">
                  <Image
                    source={{ uri: item.poster_url }}
                    style={{ width: cardWidth, height: posterHeight }}
                    className="rounded-2xl"
                    resizeMode="cover"
                  />

                  {showRating ? (
                    isHighRating ? (
                      // ── High rating (≥ 8): dark badge, top-LEFT, laurel leaves ──
                      <View
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
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
                        <Text style={{ color: "#D4AF37", fontSize: 12, fontWeight: "700", letterSpacing: 0.2 }}>
                          {ratingValue.toFixed(1)}
                        </Text>
                        <RatingIconRight size={15} color="#D4AF37" />
                      </View>
                    ) : (
                      // ── Low rating (< 8): green badge, top-LEFT ──
                      <View
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: "#3D9E4A",
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                          {ratingValue.toFixed(1)}
                        </Text>
                      </View>
                    )
                  ) : null}

                  <Text className="absolute right-3 bottom-5 text-white text-[16px] font-medium">
                    {getRemainingDuration(item)}
                  </Text>

                  <View className="absolute left-0 right-0 bottom-0 h-1.5 bg-white/40 rounded-b-2xl overflow-hidden">
                    <View
                      className="h-full bg-[#FF0000]"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            calculateProgressPercent(
                              item.last_position_seconds,
                              item.total_duration_seconds,
                            ),
                          ),
                        )}%`,
                      }}
                    />
                  </View>
                </View>

                <Text className="text-white text-base mt-2" numberOfLines={1}>
                  {resolveTitle(item)}
                </Text>
                <Text className="text-white/55 text-sm mt-1">
                  {`${Math.round(
                    calculateProgressPercent(item.last_position_seconds, item.total_duration_seconds),
                  )}%`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
