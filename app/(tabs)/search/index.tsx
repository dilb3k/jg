import { useI18n } from "@/shared/i18n/useI18n";
import { PlayIcon } from "@/shared/ui/icons/PlayIcon";
import { useSearchStore } from "@/store/search.store";
import { useRouter } from "expo-router";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  Text,
  TextStyle,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getLocalizedTitle = (
  item: { title_uz?: string; title_ru?: string; title_en?: string },
  language: "uz" | "ru" | "en",
) => {
  if (language === "uz") return item.title_uz || item.title_ru || item.title_en || "-";
  if (language === "en") return item.title_en || item.title_ru || item.title_uz || "-";
  return item.title_ru || item.title_uz || item.title_en || "-";
};

const countActiveFilters = (filters: ReturnType<typeof useSearchStore.getState>["filters"]) => {
  let count = 0;
  if (filters.type !== "all") count += 1;
  if (filters.genreIds.length > 0) count += 1;
  if (filters.countryIds.length > 0) count += 1;
  if (filters.hasSubtitle) count += 1;
  if (filters.quality) count += 1;
  if (filters.sortBy) count += 1;
  if (typeof filters.ratingFrom === "number" || typeof filters.ratingTo === "number") count += 1;
  if (typeof filters.yearFrom === "number" || typeof filters.yearTo === "number") count += 1;
  return count;
};

const searchInputStyle: TextStyle = {
  fontSize: 16,
  lineHeight: 20,
  paddingTop: 0,
  paddingBottom: 0,
  ...(Platform.OS === "android"
    ? {
        textAlignVertical: "center",
        includeFontPadding: false,
      }
    : null),
};

export default function SearchScreen() {
  const router = useRouter();
  const { t, language } = useI18n();

  const query = useSearchStore((s) => s.query);
  const filters = useSearchStore((s) => s.filters);
  const results = useSearchStore((s) => s.results);
  const loading = useSearchStore((s) => s.loading);
  const loadingMore = useSearchStore((s) => s.loadingMore);
  const error = useSearchStore((s) => s.error);
  const initialized = useSearchStore((s) => s.initialized);
  const setQuery = useSearchStore((s) => s.setQuery);
  const fetchOptions = useSearchStore((s) => s.fetchOptions);
  const fetchSearch = useSearchStore((s) => s.fetchSearch);
  const loadMore = useSearchStore((s) => s.loadMore);

  const [inputValue, setInputValue] = useState(query);

  useEffect(() => {
    if (initialized) return;
    void fetchOptions(language);
    void fetchSearch(language, { reset: true });
  }, [fetchOptions, fetchSearch, initialized, language]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== query) {
        setQuery(inputValue);
        void fetchSearch(language, { reset: true });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [fetchSearch, inputValue, language, query, setQuery]);

  const activeFilters = useMemo(() => countActiveFilters(filters), [filters]);
  const showEmpty = initialized && !loading && !error && results.length === 0 && (query.trim().length > 0 || activeFilters > 0);
  const showPlaceholder = initialized && !loading && !error && results.length === 0 && query.trim().length === 0 && activeFilters === 0;

  return (
    <SafeAreaView className="flex-1 bg-[#101010]" edges={["top"]}>
      <View className="px-4 pt-2 pb-3 flex-row items-center gap-2">
        <View className="flex-1 h-12 bg-[#2C2C2C] rounded-xl px-3 flex-row items-center gap-2">
          <Search size={18} color="#8A8A8A" />
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={t("search.placeholder")}
            placeholderTextColor="#8A8A8A"
            className="flex-1 text-white"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={searchInputStyle}
          />
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/search/filter")}
          className="w-12 h-12 rounded-xl bg-[#2C2C2C] items-center justify-center"
        >
          <SlidersHorizontal size={18} color="#D5D5D5" />
          {activeFilters > 0 ? (
            <View className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#FF0000] items-center justify-center">
              <Text className="text-white text-[10px] font-semibold">{activeFilters}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View className="px-4 pb-3">
        <Text className="text-white/45 text-xs">{t("search.topThisMonth")}</Text>
      </View>

      {loading && results.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FF0000" size="large" />
        </View>
      ) : null}

      {!loading && error && results.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-white/65 text-center mb-4">{t("search.error")}</Text>
          <Pressable
            onPress={() => void fetchSearch(language, { reset: true })}
            className="bg-[#2C2C2C] px-5 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : null}

      {showEmpty ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-14 h-14 rounded-full border border-white/40 items-center justify-center mb-4">
            <Search size={24} color="#B8B8B8" />
          </View>
          <Text className="text-white/60 text-center text-lg">{t("search.empty")}</Text>
        </View>
      ) : null}

      {showPlaceholder ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-white/60 text-center text-base">{t("search.startTyping")}</Text>
        </View>
      ) : null}

      {!loading && !showEmpty && !showPlaceholder ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            void loadMore(language);
          }}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-5">
                <ActivityIndicator color="#FF0000" />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const title = getLocalizedTitle(item, language);
            const subtitleParts = [
              item.imdb_rating ? item.imdb_rating.toFixed(1) : "-",
              t(item.type === "movie" ? "search.movie" : "search.series"),
              item.genres.slice(0, 2).map((g) => g.name).join(", "),
            ].filter(Boolean);

            return (
              <View className="flex-row items-center mb-3">
                <Image
                  source={{ uri: item.poster_url }}
                  className="w-14 h-20 rounded-lg mr-3"
                  resizeMode="cover"
                />

                <View className="flex-1 pr-2">
                  <Text className="text-white text-base font-medium" numberOfLines={1}>
                    {title}
                  </Text>
                  <Text className="text-white/55 text-xs mt-1" numberOfLines={1}>
                    {subtitleParts.join(", ")}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    if (item.type !== "movie") {
                      Alert.alert(t("common.errorTitle"), t("search.seriesSoon"));
                      return;
                    }
                    router.push(`/movie/${item.id}`);
                  }}
                  className="bg-[#FF0000] rounded-lg px-3 py-2 flex-row items-center gap-1"
                >
                  <PlayIcon size={12} color="#fff" />
                  <Text className="text-white text-xs font-semibold">{t("search.watch")}</Text>
                </Pressable>
              </View>
            );
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
