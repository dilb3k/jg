import { useI18n } from "@/shared/i18n/useI18n";
import { useTvStore } from "@/store/tv.store";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  TextStyle,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function TvChannelsScreen() {
  const router = useRouter();
  const { t, language } = useI18n();

  const categories = useTvStore((s) => s.categories);
  const selectedCategoryId = useTvStore((s) => s.selectedCategoryId);
  const channels = useTvStore((s) => s.channels);
  const loading = useTvStore((s) => s.loading);
  const loadingMore = useTvStore((s) => s.loadingMore);
  const error = useTvStore((s) => s.error);
  const initialized = useTvStore((s) => s.initialized);
  const searchQuery = useTvStore((s) => s.searchQuery);

  const initialize = useTvStore((s) => s.initialize);
  const setSearchQuery = useTvStore((s) => s.setSearchQuery);
  const fetchChannels = useTvStore((s) => s.fetchChannels);
  const setSelectedCategory = useTvStore((s) => s.setSelectedCategory);
  const loadMore = useTvStore((s) => s.loadMore);

  const [queryInput, setQueryInput] = useState(searchQuery);

  useEffect(() => {
    void initialize(language);
  }, [initialize, language]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (queryInput === searchQuery) return;
      setSearchQuery(queryInput);
      void fetchChannels(language, { reset: true });
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchChannels, language, queryInput, searchQuery, setSearchQuery]);

  const categoryItems = useMemo(
    () => [{ id: "all", name: t("tv.allCategories") }, ...categories],
    [categories, t],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#010101]" edges={["top"]}>
      <View className="px-4 pt-2 pb-3">
        <Text className="text-white text-[28px] font-semibold mb-3">{t("tv.title")}</Text>

        <View className="h-12 bg-[#2C2C2C] rounded-xl px-3 flex-row items-center gap-2">
          <Search size={18} color="#8A8A8A" />
          <TextInput
            value={queryInput}
            onChangeText={setQueryInput}
            placeholder={t("tv.searchPlaceholder")}
            placeholderTextColor="#8A8A8A"
            className="flex-1 h-full text-white"
            style={searchInputStyle}
          />
        </View>
      </View>

      <FlatList
        data={categoryItems}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
        renderItem={({ item }) => {
          const isAll = item.id === "all";
          const active = isAll ? selectedCategoryId === null : selectedCategoryId === item.id;

          return (
            <Pressable
              onPress={() => void setSelectedCategory(language, isAll ? null : item.id)}
              className={`mr-2 px-4 h-10 rounded-xl items-center justify-center ${
                active ? "bg-[#3F3F3F]" : "bg-[#1A1A1A]"
              }`}
            >
              <Text className={active ? "text-white" : "text-white/60"}>{item.name}</Text>
            </Pressable>
          );
        }}
      />

      {loading && channels.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF0000" />
        </View>
      ) : null}

      {!loading && error && channels.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white/70 text-center mb-4">{t("tv.errorLoadChannels")}</Text>
          <Pressable
            onPress={() => void fetchChannels(language, { reset: true })}
            className="bg-[#2C2C2C] rounded-xl py-3 px-5"
          >
            <Text className="text-white font-medium">{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && initialized && channels.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white/60 text-center">{t("tv.empty")}</Text>
        </View>
      ) : null}

      {!loading || channels.length > 0 ? (
        <FlatList
          data={channels}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          columnWrapperStyle={{ gap: 10 }}
          onEndReachedThreshold={0.35}
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
            const isAvailable = item.status === "available";

            return (
              <Pressable
                onPress={() => router.push({ pathname: "/(tabs)/tv/[id]", params: { id: item.id } })}
                className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 mb-3 overflow-hidden"
              >
                <View className="flex-row items-start justify-between mb-6">
                  <Text className="text-white/45 text-xs mr-2" numberOfLines={1}>
                    {item.name}
                  </Text>

                  <View className="w-12 h-12 rounded-xl bg-[#2C2C2C] items-center justify-center overflow-hidden">
                    <Image
                      source={{ uri: item.logo_url }}
                      className="w-10 h-10"
                      resizeMode="contain"
                    />
                  </View>
                </View>

                <Text className="text-white text-lg font-semibold" numberOfLines={1}>
                  {item.name}
                </Text>

                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="text-white/55 text-xs" numberOfLines={1}>
                    {isAvailable ? t("tv.available") : t("tv.unavailable")}
                  </Text>
                  <Text className="text-white/45 text-xs">#{item.order_number}</Text>
                </View>

                <View className={`mt-2 h-1 rounded-full ${isAvailable ? "bg-[#FF0000]" : "bg-[#3F3F3F]"}`} />
              </Pressable>
            );
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
