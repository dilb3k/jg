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
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReelShare from "./ReelShare";

type Props = {
  reel: Reel;
  index: number;
  itemHeight: number;
  itemWidth: number;
  bottomInset: number;
  screenActive: boolean;
};

const fill = StyleSheet.absoluteFillObject;

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
  const [secureFailed, setSecureFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  // urlResolved: gate Video mounting until we know the definitive URL.
  // This prevents double-load: candidate URL → secureStreamUrl switch mid-play.
  const [urlResolved, setUrlResolved] = useState(false);
  const urlResolvedRef = useRef(false);

  // firstFrameReady: the video has rendered at least one visible frame.
  // The poster stays ON TOP of the Video until this is true, covering the
  // native black surface that AVPlayer / ExoPlayer shows while buffering.
  const [firstFrameReady, setFirstFrameReady] = useState(false);

  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackCandidates = useMemo(() => resolveReelPlaybackCandidates(reel), [reel]);

  const isActive = index === currentIndex;
  const bottomOffset = useMemo(() => 12 + bottomInset, [bottomInset]);

  // ── Reset all per-reel state when the reel itself changes ──────────────────
  useEffect(() => {
    urlResolvedRef.current = false;
    setUrlResolved(false);
    setFirstFrameReady(false);
    setSourceIndex(0);
    setVideoReady(false);
    setIsBuffering(false);
    setSecureFailed(false);
  }, [reel.id]);

  // ── Clear pause & overlay when reel loses focus ────────────────────────────
  useEffect(() => {
    if (!isActive || !screenActive) {
      setIsPaused(false);
      setShowOverlay(false);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    }
  }, [isActive, screenActive]);

  // ── Seek to start when scrolled away (non-active) ─────────────────────────
  useEffect(() => {
    if (!isActive) {
      videoRef.current?.setPositionAsync(0).catch(() => {});
    }
  }, [isActive]);

  // ── Resolve definitive stream URL before mounting Video ────────────────────
  // Waiting here prevents the source-switch black flash:
  //   candidate URL starts → secureStreamUrl arrives → video reloads → black
  useEffect(() => {
    if (!isActive || !screenActive) return;
    if (urlResolvedRef.current) return; // Already resolved for this reel instance

    // Fast path: secure URL already cached in store
    if (streamUrlMap[reel.id]) {
      urlResolvedRef.current = true;
      setUrlResolved(true);
      return;
    }

    // Async path: fetch, then unlock the Video component
    void fetchStreamUrl(reel.id).then(() => {
      urlResolvedRef.current = true;
      setUrlResolved(true);
    });
  }, [fetchStreamUrl, isActive, reel.id, screenActive, streamUrlMap]);

  // ── Cleanup timer on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, []);

  // ── Computed values ────────────────────────────────────────────────────────
  const secureStreamUrl = streamUrlMap[reel.id];

  // Definitive URL — only available after urlResolved to prevent mid-play reload.
  const streamUrl = urlResolved
    ? ((!secureFailed && secureStreamUrl) || playbackCandidates[sourceIndex] || null)
    : null;

  // Show spinner while URL is being fetched, or while video is buffering/loading.
  const showSpinner = isActive && screenActive && (!urlResolved || !videoReady || isBuffering);

  const likesDisplay = useMemo(() => {
    const count = reel.likes_count;
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 10_000) return `${Math.floor(count / 1_000)}K`;
    return count.toString();
  }, [reel.likes_count]);

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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    const next = !isPaused;
    setIsPaused(next);
    setShowOverlay(true);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    if (!next) {
      overlayTimerRef.current = setTimeout(() => setShowOverlay(false), 700);
    }
  }, [isPaused]);

  const handleGoToMovie = useCallback(() => {
    const movie = reel.linked_movies?.[0];
    if (!movie?.id) return;
    router.push({ pathname: "/movie/[id]", params: { id: movie.id } });
  }, [reel.linked_movies, router]);

  const handleToggleLike = useCallback(() => {
    toggleLike(reel.id);
  }, [reel.id, toggleLike]);

  const handleVideoError = useCallback(() => {
    if (secureStreamUrl && !secureFailed) {
      // Secure URL failed — fall back to playbackCandidates
      setSecureFailed(true);
      setFirstFrameReady(false);
      return;
    }
    // Try next candidate
    if (sourceIndex + 1 < playbackCandidates.length) {
      setSourceIndex((prev) => prev + 1);
      setFirstFrameReady(false);
    }
  }, [playbackCandidates.length, secureFailed, secureStreamUrl, sourceIndex]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ width: itemWidth, height: itemHeight }} className="relative bg-[#101010]">
      <TouchableOpacity activeOpacity={1} onPress={handleTap} style={fill}>

        {/* ── Video layer ────────────────────────────────────────────────────
            Only mounted after urlResolved to avoid double-loading.               */}
        {streamUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: streamUrl }}
            style={fill}
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
              setFirstFrameReady(true); // First real pixel visible — safe to remove poster
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
        ) : null}

        {/* ── Poster layer ON TOP of video ───────────────────────────────────
            AVPlayer / ExoPlayer renders a black surface while loading. Keeping
            the poster above the Video until the first real frame is ready hides
            that black flash entirely — whether on first load or after a source
            switch caused by an error fallback.                                  */}
        {!firstFrameReady ? (
          <Image
            source={{ uri: reel.poster_url }}
            style={fill}
            resizeMode="cover"
          />
        ) : null}

        {/* Play / Pause icon overlay */}
        {showOverlay ? (
          <View style={fill} className="items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center">
              {isPaused
                ? <PlayIcon size={28} color="#fff" />
                : <PauseIcon size={24} color="#fff" />}
            </View>
          </View>
        ) : null}

        {/* Loading / buffering spinner */}
        {showSpinner ? (
          <View style={fill} className="items-center justify-center">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Gradient scrim */}
      <View className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Reel info — bottom left */}
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
          <Text className="text-white text-base font-bold tracking-tight" numberOfLines={2}>
            {title}
          </Text>
          {reel.linked_movies?.[0] ? (
            <Text className="text-white/80 text-sm font-medium" numberOfLines={1}>
              {movieTitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Action buttons — bottom right */}
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
          <Text className="text-white text-xs font-semibold mb-4">{t("reels.share")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoToMovie} activeOpacity={0.7} className="items-center">
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
