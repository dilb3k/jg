import { useI18n } from "@/shared/i18n/useI18n";
import { WatchHistoryItem } from "@/shared/types/watch-history";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { MovieCard } from "./MovieCard";

export function WatchHistorySection({ items }: { items: WatchHistoryItem[] }) {
  const router = useRouter();
  const { t } = useI18n();

  if (!items.length) return null;

  return (
    <View className="mb-7">
      <Text className="text-white text-[22px] font-semibold px-4 mb-3">
        {t("home.continueWatching")}
      </Text>

      <ScrollView horizontal className="px-4" showsHorizontalScrollIndicator={false}>
        {items.map((item) => (
          <MovieCard
            key={item.id}
            movie={{
              id: item.content_id,
              poster_url: item.poster_url,
              imdb_rating: `${item.progress_percent}%`,
            }}
            onPress={() =>
              router.push({
                pathname: "/movie/[id]",
                params: { id: item.content_id },
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}
