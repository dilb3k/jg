import { useI18n } from "@/shared/i18n/useI18n";
import { useSearchStore } from "@/store/search.store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronLeft, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  Text,
  TextStyle,
  TextInput,
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

export default function SearchSelectScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode === "country" ? "country" : "genre";

  const genres = useSearchStore((s) => s.genres);
  const countries = useSearchStore((s) => s.countries);
  const draftFilters = useSearchStore((s) => s.draftFilters);
  const setDraftGenreIds = useSearchStore((s) => s.setDraftGenreIds);
  const setDraftCountryIds = useSearchStore((s) => s.setDraftCountryIds);

  const [searchValue, setSearchValue] = useState("");

  const items = useMemo(() => {
    const data = mode === "genre" ? genres : countries;
    const q = searchValue.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) => item.name.toLowerCase().includes(q));
  }, [countries, genres, mode, searchValue]);

  const selectedIds = mode === "genre" ? draftFilters.genreIds : draftFilters.countryIds;

  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id];

    if (mode === "genre") {
      setDraftGenreIds(next);
      return;
    }

    setDraftCountryIds(next);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#101010]" edges={["top"]}>
      <View className="px-4 h-14 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-[#2C2C2C] items-center justify-center">
          <ChevronLeft size={20} color="#fff" />
        </Pressable>

        <Text className="text-white text-lg font-medium">
          {mode === "genre" ? t("search.genres") : t("search.country")}
        </Text>

        <View className="w-10" />
      </View>

      <View className="px-4 pb-3">
        <View className="h-12 bg-[#2C2C2C] rounded-xl px-3 flex-row items-center gap-2">
          <Search size={18} color="#8A8A8A" />
          <TextInput
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder={mode === "genre" ? t("search.searchGenre") : t("search.searchCountry")}
            placeholderTextColor="#8A8A8A"
            className="flex-1 text-white"
            style={searchInputStyle}
          />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              className="h-14 px-4 mb-2 bg-[#161719] rounded-xl flex-row items-center"
            >
              <Text className="text-white text-base flex-1">{item.name}</Text>
              {selected ? <Check size={20} color="#fff" /> : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="pt-12">
            <Text className="text-white/55 text-center">{t("search.nothingFound")}</Text>
          </View>
        }
      />

      <View className="px-4 pb-5 pt-3 border-t border-white/5">
        <Pressable onPress={() => router.back()} className="bg-white py-4 rounded-xl">
          <Text className="text-black text-center font-semibold text-base">{t("search.apply")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
