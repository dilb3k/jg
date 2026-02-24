import { useI18n } from "@/shared/i18n/useI18n";
import { SearchFilters } from "@/shared/types/search";
import { useSearchStore } from "@/store/search.store";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const qualityOptions: NonNullable<SearchFilters["quality"]>[] = ["hd", "full_hd", "2k", "4k"];
const sortOptions: NonNullable<SearchFilters["sortBy"]>[] = ["rating", "popularity", "date"];

export default function SearchFilterScreen() {
  const router = useRouter();
  const { t, language } = useI18n();

  const draftFilters = useSearchStore((s) => s.draftFilters);
  const genres = useSearchStore((s) => s.genres);
  const countries = useSearchStore((s) => s.countries);
  const fetchOptions = useSearchStore((s) => s.fetchOptions);
  const startFilterDraft = useSearchStore((s) => s.startFilterDraft);
  const updateDraftFilters = useSearchStore((s) => s.updateDraftFilters);
  const resetDraftFilters = useSearchStore((s) => s.resetDraftFilters);
  const applyDraftFilters = useSearchStore((s) => s.applyDraftFilters);
  const discardDraftFilters = useSearchStore((s) => s.discardDraftFilters);
  const fetchSearch = useSearchStore((s) => s.fetchSearch);

  const appliedRef = useRef(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    startFilterDraft();
    void fetchOptions(language);

    return () => {
      if (!appliedRef.current) {
        discardDraftFilters();
      }
    };
  }, [discardDraftFilters, fetchOptions, language, startFilterDraft]);

  const selectedGenreLabel = useMemo(() => {
    if (draftFilters.genreIds.length === 0) return t("search.any");
    if (draftFilters.genreIds.length === 1) {
      const match = genres.find((g) => g.id === draftFilters.genreIds[0]);
      return match?.name ?? t("search.selectedCount", { count: 1 });
    }
    return t("search.selectedCount", { count: draftFilters.genreIds.length });
  }, [draftFilters.genreIds, genres, t]);

  const selectedCountryLabel = useMemo(() => {
    if (draftFilters.countryIds.length === 0) return t("search.any");
    if (draftFilters.countryIds.length === 1) {
      const match = countries.find((c) => c.id === draftFilters.countryIds[0]);
      return match?.name ?? t("search.selectedCount", { count: 1 });
    }
    return t("search.selectedCount", { count: draftFilters.countryIds.length });
  }, [countries, draftFilters.countryIds, t]);

  const updateNumeric = (
    key: keyof Pick<SearchFilters, "ratingFrom" | "ratingTo" | "yearFrom" | "yearTo">,
    text: string,
  ) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (!cleaned) {
      updateDraftFilters({ [key]: undefined });
      return;
    }

    const value = Number(cleaned);
    if (!Number.isFinite(value)) return;

    if (key === "ratingFrom" || key === "ratingTo") {
      const clamped = Math.max(0, Math.min(10, value));
      updateDraftFilters({ [key]: clamped });
      return;
    }

    const currentYear = new Date().getFullYear();
    const clampedYear = Math.min(currentYear, value);
    updateDraftFilters({ [key]: clampedYear });
  };

  const apply = async () => {
    if (applying) return;
    setApplying(true);
    try {
      applyDraftFilters();
      appliedRef.current = true;
      await fetchSearch(language, { reset: true });
      router.back();
    } finally {
      setApplying(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#060709]" edges={["top"]}>
      <View className="px-4 h-14 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-[#2C2C2C] items-center justify-center">
          <ChevronLeft size={20} color="#fff" />
        </Pressable>

        <Text className="text-white text-lg font-medium">{t("search.filter")}</Text>

        <Pressable onPress={resetDraftFilters}>
          <Text className="text-[#FF4C4C] text-sm">{t("search.reset")}</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-white/45 text-sm mb-2 mt-2">{t("search.show")}</Text>
        <View className="bg-[#141416] rounded-xl p-1 flex-row mb-4">
          {(["all", "movie", "series"] as const).map((value) => {
            const active = draftFilters.type === value;
            return (
              <Pressable
                key={value}
                onPress={() => updateDraftFilters({ type: value })}
                className={`flex-1 py-2.5 rounded-lg ${active ? "bg-[#2C2C2C]" : "bg-transparent"}`}
              >
                <Text className={`text-center ${active ? "text-white" : "text-white/55"}`}>
                  {t(
                    value === "all"
                      ? "search.all"
                      : value === "movie"
                        ? "search.movies"
                        : "search.seriesTab",
                  )}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="bg-[#141416] rounded-xl overflow-hidden mb-4">
          <Pressable
            onPress={() => router.push({ pathname: "/(tabs)/search/select", params: { mode: "genre" } })}
            className="h-14 px-4 flex-row items-center justify-between border-b border-white/5"
          >
            <Text className="text-white text-base">{t("search.genres")}</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-white/55 text-sm">{selectedGenreLabel}</Text>
              <ChevronRight size={16} color="#888" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: "/(tabs)/search/select", params: { mode: "country" } })}
            className="h-14 px-4 flex-row items-center justify-between"
          >
            <Text className="text-white text-base">{t("search.country")}</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-white/55 text-sm">{selectedCountryLabel}</Text>
              <ChevronRight size={16} color="#888" />
            </View>
          </Pressable>
        </View>

        <View className="bg-[#141416] rounded-xl px-4 py-3 mb-4 flex-row items-center justify-between">
          <Text className="text-white text-base">{t("search.subtitles")}</Text>
          <Switch
            value={draftFilters.hasSubtitle}
            onValueChange={(value) => updateDraftFilters({ hasSubtitle: value })}
            trackColor={{ false: "#3A3A3A", true: "#FF0000" }}
            thumbColor="#FFF"
          />
        </View>

        <Text className="text-white/45 text-sm mb-2">{t("search.quality")}</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {qualityOptions.map((value) => {
            const active = draftFilters.quality === value;
            return (
              <Pressable
                key={value}
                onPress={() => updateDraftFilters({ quality: active ? undefined : value })}
                className={`px-4 py-2.5 rounded-xl ${active ? "bg-[#FF0000]" : "bg-[#2C2C2C]"}`}
              >
                <Text className="text-white font-medium">{t(`search.quality.${value}`)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="text-white/45 text-sm mb-2">{t("search.rating")}</Text>
        <View className="flex-row items-center gap-2 mb-4">
          <TextInput
            value={draftFilters.ratingFrom?.toString() ?? ""}
            onChangeText={(text) => updateNumeric("ratingFrom", text)}
            placeholder="0"
            placeholderTextColor="#7E7E7E"
            keyboardType="number-pad"
            className="flex-1 h-12 bg-[#2C2C2C] rounded-xl px-4 text-white"
            style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
          />
          <Text className="text-white/55">-</Text>
          <TextInput
            value={draftFilters.ratingTo?.toString() ?? ""}
            onChangeText={(text) => updateNumeric("ratingTo", text)}
            placeholder="10"
            placeholderTextColor="#7E7E7E"
            keyboardType="number-pad"
            className="flex-1 h-12 bg-[#2C2C2C] rounded-xl px-4 text-white"
            style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
          />
        </View>

        <Text className="text-white/45 text-sm mb-2">{t("search.year")}</Text>
        <View className="flex-row items-center gap-2 mb-4">
          <TextInput
            value={draftFilters.yearFrom?.toString() ?? ""}
            onChangeText={(text) => updateNumeric("yearFrom", text)}
            placeholder="2000"
            placeholderTextColor="#7E7E7E"
            keyboardType="number-pad"
            className="flex-1 h-12 bg-[#2C2C2C] rounded-xl px-4 text-white"
            style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
          />
          <Text className="text-white/55">-</Text>
          <TextInput
            value={draftFilters.yearTo?.toString() ?? ""}
            onChangeText={(text) => updateNumeric("yearTo", text)}
            placeholder={String(new Date().getFullYear())}
            placeholderTextColor="#7E7E7E"
            keyboardType="number-pad"
            className="flex-1 h-12 bg-[#2C2C2C] rounded-xl px-4 text-white"
            style={{ textAlignVertical: "center", paddingVertical: 0, includeFontPadding: false }}
          />
        </View>

        <Text className="text-white/45 text-sm mb-2">{t("search.sortBy")}</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {sortOptions.map((value) => {
            const active = draftFilters.sortBy === value;
            return (
              <Pressable
                key={value}
                onPress={() => updateDraftFilters({ sortBy: active ? undefined : value })}
                className={`px-4 py-2.5 rounded-xl ${active ? "bg-[#FF0000]" : "bg-[#2C2C2C]"}`}
              >
                <Text className="text-white font-medium">{t(`search.sort.${value}`)}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-4 pb-5 pt-3 border-t border-white/5">
        <Pressable
          onPress={() => void apply()}
          disabled={applying}
          className={`py-4 rounded-xl items-center justify-center ${applying ? "bg-white/60" : "bg-white"}`}
        >
          {applying ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-black text-center font-semibold text-base">{t("search.apply")}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
