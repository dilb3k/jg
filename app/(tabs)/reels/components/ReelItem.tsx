import { Reel } from "@/shared/types/reel";
import { useI18n } from "@/shared/i18n/useI18n";
import { HeartIcon } from "@/shared/ui/icons/HeartIcon";
import { PlayIcon } from "@/shared/ui/icons/PlayIcon";
import { ShareIcon } from "@/shared/ui/icons/ShareIcon";
import { useReelStore } from "@/store/reel.store";
import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import ReelShare from "./ReelShare";

type Props = {
  reel: Reel;
  index: number;
  itemHeight: number;
  itemWidth: number;
  bottomInset: number;
};

function ReelItem({ reel, index, itemHeight, itemWidth, bottomInset }: Props) {
  const { t } = useI18n();
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const currentIndex = useReelStore((state) => state.currentIndex);
  const toggleLike = useReelStore((state) => state.toggleLike);
  const [shareVisible, setShareVisible] = useState(false);

  const isActive = index === currentIndex;
  const bottomOffset = useMemo(() => 20 + bottomInset, [bottomInset]);

  useEffect(() => {
    let cancelled = false;

    const syncPlayback = async () => {
      const player = videoRef.current;
      if (!player) return;

      try {
        if (isActive) {
          await player.playAsync();
          return;
        }

        await player.pauseAsync();
        if (!cancelled) {
          await player.setPositionAsync(0);
        }
      } catch {
        // Ignore playback race errors when user scrolls fast.
      }
    };

    syncPlayback();

    return () => {
      cancelled = true;
    };
  }, [isActive]);

  const handleGoToMovie = useCallback(() => {
    const movie = reel.linked_movies?.[0];
    if (!movie?.id) return;

    router.push({
      pathname: "/movie/[id]",
      params: { id: movie.id },
    });
  }, [reel.linked_movies, router]);

  const handleToggleLike = useCallback(() => {
    toggleLike(reel.id);
  }, [reel.id, toggleLike]);

  const likesDisplay = useMemo(
    () =>
      reel.likes_count > 9999
        ? `${(reel.likes_count / 1000).toFixed(0)}K`
        : reel.likes_count.toString(),
    [reel.likes_count],
  );

  const title = reel.title_uz || reel.title_ru || reel.title_en || "-";
  const movieTitle =
    reel.linked_movies?.[0]?.title_uz ||
    reel.linked_movies?.[0]?.title_ru ||
    reel.linked_movies?.[0]?.title_en ||
    t("reels.movieFallback");

  return (
    <View
      style={{ width: itemWidth, height: itemHeight }}
      className="relative bg-black"
    >
      {reel.flussonic_vod_path ? (
        <Video
          ref={videoRef}
          source={{ uri: reel.flussonic_vod_path }}
          style={{ width: "100%", height: "100%" }}
          isLooping
          shouldPlay={isActive}
          useNativeControls={false}
          resizeMode={ResizeMode.COVER}
        />
      ) : (
        <Image
          source={{ uri: reel.poster_url }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      )}

      <View className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      <View
        style={{ bottom: bottomOffset }}
        className="absolute left-5 right-5 flex-row items-center gap-3 pr-20"
      >
        <Image
          source={{ uri: reel.poster_url }}
          className="w-14 h-14 rounded-full"
          resizeMode="cover"
        />

        <View className="flex-1 gap-1">
          <Text
            className="text-white text-base font-bold tracking-tight"
            numberOfLines={2}
          >
            {title}
          </Text>
          {reel.linked_movies?.[0] ? (
            <Text className="text-white/80 text-sm font-medium" numberOfLines={1}>
              {movieTitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ bottom: bottomOffset }} className="absolute right-4 items-center gap-6">
        <TouchableOpacity onPress={handleToggleLike} activeOpacity={0.7}>
          <HeartIcon filled={reel.is_liked} />
          <Text className="text-white text-center text-base font-semibold mt-1">
            {likesDisplay}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShareVisible(true)}
          activeOpacity={0.7}
          className="items-center"
        >
          <ShareIcon color="#fff" />
          <Text className="text-white text-xs font-semibold mt-1 mb-2">
            {t("reels.share")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoToMovie}
          activeOpacity={0.7}
          className="items-center"
        >
          <PlayIcon />
          <Text className="text-white font-semibold mt-2 text-xs">{t("reels.watch")}</Text>
        </TouchableOpacity>
      </View>

      <ReelShare
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        reel={reel}
      />
    </View>
  );
}

export default memo(ReelItem);
