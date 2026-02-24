import { useI18n } from "@/shared/i18n/useI18n";
import { WatchHistoryItem } from "@/shared/types/watch-history";
import { calculateProgressPercent, formatDurationHM } from "@/shared/utils/time";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Star } from "lucide-react-native";

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
        {items.map((item) => (
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

                {item.imdb_rating ? (
                  <View className="absolute top-3 left-3 bg-[#D9C17A] px-2 py-1 rounded-md flex-row items-center">
                    <Star size={10} color="#111" fill="#111" />
                    <Text className="text-[#111] text-xs ml-1 font-semibold">{item.imdb_rating}</Text>
                  </View>
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
        ))}
      </ScrollView>
    </View>
  );
}
