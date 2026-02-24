import { useI18n } from "@/shared/i18n/useI18n";
import { TvProgram } from "@/shared/types/tv";
import { getTvDateKey, useTvStore } from "@/store/tv.store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Play } from "lucide-react-native";
import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAY_MS = 24 * 60 * 60 * 1000;

const formatClock = (value: string) => {
  const date = new Date(value);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const formatDateLabel = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return `${String(date.getDate()).padStart(2, "0")}.${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}.${date.getFullYear()}`;
};

const getDateChips = (t: (key: string) => string) => {
  const today = new Date();
  return [0, 1, 2, 3].map((offset) => {
    const date = new Date(today.getTime() + offset * DAY_MS);
    const key = getTvDateKey(date);

    if (offset === 0) return { key, label: t("tv.today") };
    if (offset === 1) return { key, label: t("tv.tomorrow") };

    return {
      key,
      label: formatDateLabel(key),
    };
  });
};

const ProgramItem = ({
  item,
  isLive,
}: {
  item: TvProgram;
  isLive: boolean;
}) => (
  <View className="rounded-2xl bg-[#1A1A1A] px-4 py-3 mb-2.5">
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1">
        <Text className="text-white text-xl mb-1" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-white/50 text-sm">
          {formatClock(item.starts_at)} - {formatClock(item.ends_at)}
        </Text>
      </View>

      {isLive ? (
        <View className="bg-[#FF0000] px-3 py-1 rounded-lg">
          <Text className="text-white text-xs font-semibold">LIVE</Text>
        </View>
      ) : null}
    </View>
  </View>
);

export default function TvChannelDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t, language } = useI18n();

  const detail = useTvStore((s) => s.detail);
  const currentProgram = useTvStore((s) => s.currentProgram);
  const schedule = useTvStore((s) => s.schedule);
  const upcoming = useTvStore((s) => s.upcoming);
  const selectedDate = useTvStore((s) => s.selectedDate);
  const detailLoading = useTvStore((s) => s.detailLoading);
  const detailError = useTvStore((s) => s.detailError);
  const openChannel = useTvStore((s) => s.openChannel);
  const setScheduleDate = useTvStore((s) => s.setScheduleDate);

  useEffect(() => {
    if (!id) return;
    void openChannel(language, id);
  }, [id, language, openChannel]);

  const dateChips = useMemo(() => getDateChips(t), [t]);

  const listData = schedule.length > 0 ? schedule : upcoming;

  return (
    <SafeAreaView className="flex-1 bg-[#101010]" edges={["top"]}>
      <View className="px-4 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full bg-[#2C2C2C] items-center justify-center"
        >
          <ChevronLeft size={20} color="#fff" />
        </Pressable>

        <View className="w-11 h-11 rounded-full bg-[#2C2C2C] items-center justify-center">
          <Text className="text-white text-lg">☆</Text>
        </View>
      </View>

      {detailLoading && !detail ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF0000" />
        </View>
      ) : null}

      {!detailLoading && detailError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white/70 text-center mb-4">{t("tv.errorLoadChannel")}</Text>
          <Pressable
            onPress={() => {
              if (!id) return;
              void openChannel(language, id);
            }}
            className="bg-[#2C2C2C] rounded-xl py-3 px-5"
          >
            <Text className="text-white font-medium">{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : null}

      {detail ? (
        <View className="flex-1">
          <View className="px-4">
            <View className="h-52 rounded-2xl bg-[#2C2C2C] overflow-hidden items-center justify-center mb-4">
              {detail.logo_url ? (
                <Image
                  source={{ uri: detail.logo_url }}
                  className="absolute inset-0 w-full h-full opacity-35"
                  resizeMode="contain"
                />
              ) : null}

              <View className="w-14 h-14 rounded-full bg-[#3F3F3F] items-center justify-center">
                <Play size={22} color="#fff" fill="#fff" />
              </View>

              {currentProgram ? (
                <View className="absolute top-3 right-3 bg-[#FF0000] px-3 py-1 rounded-lg">
                  <Text className="text-white text-xs font-semibold">{t("tv.liveNow")}</Text>
                </View>
              ) : null}
            </View>

            <View className="flex-row items-center mb-5">
              <View className="w-14 h-14 rounded-full bg-[#2C2C2C] items-center justify-center overflow-hidden mr-3">
                <Image source={{ uri: detail.logo_url }} className="w-12 h-12" resizeMode="contain" />
              </View>
              <Text className="text-white text-3xl font-semibold flex-1" numberOfLines={1}>
                {detail.name}
              </Text>
            </View>

            <Text className="text-white text-[28px] font-semibold mb-3">{t("tv.schedule")}</Text>
          </View>

          <FlatList
            data={listData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            ListHeaderComponent={
              <View className="mb-3">
                <FlatList
                  horizontal
                  data={dateChips}
                  keyExtractor={(item) => item.key}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const active = selectedDate === item.key;
                    return (
                      <Pressable
                        onPress={() => {
                          if (!id) return;
                          void setScheduleDate(language, id, item.key);
                        }}
                        className={`mr-2 h-10 px-4 rounded-xl items-center justify-center ${
                          active ? "bg-[#3F3F3F]" : "bg-[#1A1A1A]"
                        }`}
                      >
                        <Text className={active ? "text-white" : "text-white/55"}>{item.label}</Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
            }
            renderItem={({ item }) => {
              const isLive = Boolean(currentProgram?.id && currentProgram.id === item.id);
              return <ProgramItem item={item} isLive={isLive} />;
            }}
            ListEmptyComponent={
              detailLoading ? (
                <View className="pt-6">
                  <ActivityIndicator color="#FF0000" />
                </View>
              ) : (
                <Text className="text-white/60 text-center pt-10">{t("tv.emptySchedule")}</Text>
              )
            }
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
