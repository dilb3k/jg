import { useI18n } from "@/shared/i18n/useI18n";
import { Reel } from "@/shared/types/reel";
import { HeartIcon } from "@/shared/ui/icons/HeartIcon";
import { PauseIcon } from "@/shared/ui/icons/PauseIcon";
import { PlayIcon } from "@/shared/ui/icons/PlayIcon";
import { ShareIcon } from "@/shared/ui/icons/ShareIcon";
import { resolveReelPlaybackCandidates } from "@/shared/utils/reel";
import { useReelStore } from "@/store/reel.store";
import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import ReelShare from "./ReelShare";

type Props = {
  reel: Reel;
  index: number;
  itemHeight: number;
  itemWidth: number;
  bottomInset: number;
  screenActive: boolean;
};

function ReelItem({ reel, index, itemHeight, itemWidth, bottomInset, screenActive }: Props) {
  const { t, language } = useI18n();
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const currentIndex = useReelStore((state) => state.currentIndex);
  const toggleLike = useReelStore((state) => state.toggleLike);
  const streamUrlMap = useReelStore((state) => state.streamUrlMap);
  const fetchStreamUrl = useReelStore((state) => state.fetchStreamUrl);
  const [shareVisible, setShareVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackCandidates = useMemo(() => resolveReelPlaybackCandidates(reel), [reel]);
  const [sourceIndex, setSourceIndex] = useState(0);

  const isActive = index === currentIndex;
  const bottomOffset = useMemo(() => 12 + bottomInset, [bottomInset]);

  useEffect(() => {
    setSourceIndex(0);
    setVideoReady(false);
    setIsBuffering(false);
  }, [reel.id]);

  useEffect(() => {
    if (!isActive || !screenActive) {
      setIsPaused(false);
      setShowOverlay(false);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    }
  }, [isActive, screenActive]);

  useEffect(() => {
    if (!isActive || !screenActive) return;
    void fetchStreamUrl(reel.id);
  }, [fetchStreamUrl, isActive, reel.id, screenActive]);

  useEffect(() => {
    let cancelled = false;

    const syncPlayback = async () => {
      const player = videoRef.current;
      if (!player) return;

      try {
        if (isActive && screenActive && !isPaused) {
          await player.playAsync();
          return;
        }

        await player.pauseAsync();
        if (!cancelled && !isActive) {
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
  }, [isActive, isPaused, screenActive]);

  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, []);

  const handleTap = useCallback(() => {
    const next = !isPaused;
    setIsPaused(next);
    setShowOverlay(true);

    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);

    if (!next) {
      // Resumed → briefly show play icon then hide
      overlayTimerRef.current = setTimeout(() => setShowOverlay(false), 700);
    }
    // Paused → overlay stays visible
  }, [isPaused]);

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

  const pickLocalized = (value: { title_uz?: string; title_ru?: string; title_en?: string }) => {
    if (language === "uz") return value.title_uz || value.title_ru || value.title_en;
    if (language === "en") return value.title_en || value.title_ru || value.title_uz;
    return value.title_ru || value.title_uz || value.title_en;
  };

  const title = pickLocalized(reel) || "-";
  const movieTitle =
    (reel.linked_movies?.[0] ? pickLocalized(reel.linked_movies[0]) : undefined) ||
    (reel.linked_episodes?.[0] ? pickLocalized(reel.linked_episodes[0]) : undefined) ||
    t("reels.movieFallback");
  const secureStreamUrl = streamUrlMap[reel.id];
  const streamUrl = secureStreamUrl || playbackCandidates[sourceIndex] || null;

  const handleVideoError = () => {
    if (secureStreamUrl) {
      return;
    }
    setSourceIndex((prev) => (prev + 1 < playbackCandidates.length ? prev + 1 : prev));
  };

  return (
    <View
      style={{ width: itemWidth, height: itemHeight }}
      className="relative bg-black"
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTap}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {streamUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: streamUrl }}
            style={{ width: "100%", height: "100%" }}
            isLooping
            shouldPlay={isActive && screenActive && !isPaused}
            useNativeControls={false}
            resizeMode={ResizeMode.COVER}
            onLoadStart={() => {
              setIsBuffering(true);
              setVideoReady(false);
            }}
            onReadyForDisplay={() => {
              setIsBuffering(false);
              setVideoReady(true);
            }}
            onPlaybackStatusUpdate={(status) => {
              if (!status.isLoaded) {
                setIsBuffering(true);
                return;
              }
              if (!videoReady) setVideoReady(true);
              setIsBuffering(Boolean(status.isBuffering));
            }}
            onError={handleVideoError}
          />
        ) : (
          <Image
            source={{ uri: reel.poster_url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        )}

        {showOverlay ? (
          <View
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            className="items-center justify-center"
          >
            <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center">
              {isPaused ? <PlayIcon size={28} color="#fff" /> : <PauseIcon size={24} color="#fff" />}
            </View>
          </View>
        ) : null}

        {isActive && screenActive && streamUrl && (!videoReady || isBuffering) ? (
          <View
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            className="items-center justify-center"
          >
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : null}
      </TouchableOpacity>

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

      <View style={{ bottom: bottomOffset }} className="absolute right-4 items-center gap-4">
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
          <Text className="text-white text-xs font-semibold mb-4">
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
