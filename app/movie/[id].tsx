import { getMovieStream, updateMovieStreamProgress } from "@/services/movie.service";
import { useI18n } from "@/shared/i18n/useI18n";
import { BackIcon } from "@/shared/ui/icons/BackIcon";
import { NotMovieIcon } from "@/shared/ui/icons/NotMovieIcon";
import { PauseIcon } from "@/shared/ui/icons/PauseIcon";
import { PlayIcon } from "@/shared/ui/icons/PlayIcon";
import { SkipBackIcon } from "@/shared/ui/icons/SkipBackIcon";
import { SkipForwardIcon } from "@/shared/ui/icons/SkipForwardIcon";
import { useFavoritesStore } from "@/store/favorites.store";
import { useMovieStore } from "@/store/movie.store";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import * as ScreenOrientation from "expo-screen-orientation";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Bookmark, Star, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const POSTER_HEIGHT = Math.round(SCREEN_HEIGHT * 0.48);

export default function MovieDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  // Progress tracking refs (avoid stale closures)
  const progressRef = useRef(0);
  const resumedRef = useRef(false);
  const currentPositionRef = useRef(0);
  const currentDurationRef = useRef(0);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerPaused, setPlayerPaused] = useState(false);
  const playerPausedRef = useRef(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [resumePosition, setResumePosition] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);

  // Controls auto-hide
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsVisibleRef = useRef(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Progress bar width for seek calc
  const [progressBarWidth, setProgressBarWidth] = useState(300);

  // Favorites
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const movie = useMovieStore((state) => state.movie);
  const loading = useMovieStore((state) => state.loading);
  const fetchMovie = useMovieStore((state) => state.fetchMovie);
  const clear = useMovieStore((state) => state.clear);
  const checkFavorite = useFavoritesStore((state) => state.checkFavorite);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const handleGoBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/home");
  };

  useEffect(() => {
    if (!id) return;
    fetchMovie(id);
    return () => {
      clear();
    };
  }, [clear, fetchMovie, id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const run = async () => {
      try {
        const value = await checkFavorite(id);
        if (active) setIsFavorite(value);
      } catch {
        if (active) setIsFavorite(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [checkFavorite, id]);

  // Auto-save progress every 15 s while playing
  useEffect(() => {
    if (!isPlaying || !id) return;
    const interval = setInterval(() => {
      const seconds = Math.floor(progressRef.current / 1000);
      if (seconds <= 0) return;
      void updateMovieStreamProgress(id, seconds);
    }, 15000);
    return () => clearInterval(interval);
  }, [id, isPlaying]);

  // Save on unmount + restore portrait orientation
  useEffect(() => {
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      if (!id) return;
      const seconds = Math.floor(progressRef.current / 1000);
      if (seconds <= 0) return;
      void updateMovieStreamProgress(id, seconds);
    };
  }, [id]);

  // Cleanup controls timer
  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const scheduleHideControls = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
      controlsVisibleRef.current = false;
    }, 3000);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    controlsVisibleRef.current = true;
    if (!playerPausedRef.current) scheduleHideControls();
  }, [scheduleHideControls]);

  const handleTapPlayer = useCallback(() => {
    if (!controlsVisibleRef.current) {
      showControlsTemporarily();
    } else {
      setControlsVisible(false);
      controlsVisibleRef.current = false;
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    }
  }, [showControlsTemporarily]);

  const togglePause = useCallback(() => {
    const next = !playerPausedRef.current;
    playerPausedRef.current = next;
    setPlayerPaused(next);
    if (next) {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      setControlsVisible(true);
      controlsVisibleRef.current = true;
    } else {
      scheduleHideControls();
    }
  }, [scheduleHideControls]);

  const skipSeconds = useCallback(
    async (delta: number) => {
      const player = videoRef.current;
      if (!player) return;
      const newPos = Math.max(
        0,
        Math.min(currentDurationRef.current, currentPositionRef.current + delta * 1000),
      );
      try {
        await player.setPositionAsync(newPos);
        currentPositionRef.current = newPos;
        progressRef.current = newPos;
        setPositionMs(newPos);
        showControlsTemporarily();
      } catch {}
    },
    [showControlsTemporarily],
  );

  const handleSeek = useCallback(
    async (locationX: number) => {
      const player = videoRef.current;
      if (!player || !currentDurationRef.current) return;
      const pct = Math.max(0, Math.min(1, locationX / progressBarWidth));
      const newPos = pct * currentDurationRef.current;
      try {
        await player.setPositionAsync(newPos);
        currentPositionRef.current = newPos;
        progressRef.current = newPos;
        setPositionMs(newPos);
      } catch {}
    },
    [progressBarWidth],
  );

  const handlePlayPress = async () => {
    if (!id) return;
    setPlayerLoading(true);
    try {
      const payload = await getMovieStream(id);
      if (!payload?.stream_url) {
        Alert.alert(t("common.errorTitle"), t("movie.noStream"));
        return;
      }
      const resume = Math.max(0, payload.resume_position_seconds ?? 0);
      const dur = Math.max(0, payload.duration_seconds ?? 0) * 1000;

      setStreamUrl(payload.stream_url);
      setResumePosition(resume);
      setPositionMs(resume * 1000);
      setDurationMs(dur);
      currentPositionRef.current = resume * 1000;
      currentDurationRef.current = dur;
      progressRef.current = resume * 1000;
      resumedRef.current = false;
      playerPausedRef.current = false;
      setPlayerPaused(false);
      setControlsVisible(true);
      controlsVisibleRef.current = true;
      setIsPlaying(true);
      scheduleHideControls();
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } catch {
      Alert.alert(t("common.errorTitle"), t("movie.noStream"));
    } finally {
      setPlayerLoading(false);
    }
  };

  const closePlayer = async () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (id && progressRef.current > 0) {
      await updateMovieStreamProgress(id, Math.floor(progressRef.current / 1000));
    }
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    setIsPlaying(false);
    playerPausedRef.current = false;
    setPlayerPaused(false);
    setStreamUrl(null);
    setResumePosition(0);
    setPositionMs(0);
    setDurationMs(0);
    currentPositionRef.current = 0;
    currentDurationRef.current = 0;
    progressRef.current = 0;
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPlayerLoading(Boolean(status.isBuffering));
    const pos = status.positionMillis ?? 0;
    const dur = status.durationMillis ?? 0;
    setPositionMs(pos);
    if (dur) {
      setDurationMs(dur);
      currentDurationRef.current = dur;
    }
    currentPositionRef.current = pos;
    progressRef.current = pos;
    if (!resumedRef.current && resumePosition > 0) {
      resumedRef.current = true;
      void videoRef.current?.setPositionAsync(resumePosition * 1000);
    }
  };

  const handleToggleFavorite = async () => {
    if (!id || favoriteLoading) return;
    setFavoriteLoading(true);
    const result = await toggleFavorite(id);
    setFavoriteLoading(false);
    if (result === null) {
      Alert.alert(t("common.errorTitle"), t("common.error"));
      return;
    }
    setIsFavorite(result);
  };

  const formatClock = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return hh > 0 ? `${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
  };

  const progressPercent = !durationMs
    ? 0
    : Math.max(0, Math.min(100, (positionMs / durationMs) * 100));

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  // ── No movie ─────────────────────────────────────────────────────────────────
  if (!movie) {
    return (
      <View className="flex-1 bg-[#101010]">
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <TouchableOpacity
          onPress={handleGoBack}
          style={{ paddingTop: insets.top + 12, paddingLeft: 16, paddingBottom: 8 }}
        >
          <BackIcon color="#fff" size={24} />
        </TouchableOpacity>
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ marginTop: -60 }}
        >
          <NotMovieIcon color="#555" size={52} />
          <Text className="text-gray-400 mt-4 text-base">{t("common.noData")}</Text>
        </View>
      </View>
    );
  }

  // ── Localise ─────────────────────────────────────────────────────────────────
  const title =
    language === "uz"
      ? movie.title_uz || movie.title_ru || movie.title_en
      : language === "en"
        ? movie.title_en || movie.title_ru || movie.title_uz
        : movie.title_ru || movie.title_uz || movie.title_en;

  const description =
    language === "uz"
      ? movie.description_uz || movie.description_ru || movie.description_en
      : language === "en"
        ? movie.description_en || movie.description_ru || movie.description_uz
        : movie.description_ru || movie.description_uz || movie.description_en;

  const durationMins = movie.duration_seconds
    ? Math.round(movie.duration_seconds / 60)
    : null;

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-[#101010]">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
        hidden={isPlaying}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 88 }}
      >
        {/* ── Poster hero ─────────────────────────────────────────────────── */}
        <View style={{ height: POSTER_HEIGHT }}>
          <Image
            source={{ uri: movie.poster_url }}
            style={{ width: "100%", height: POSTER_HEIGHT }}
            resizeMode="cover"
          />

          {/* Bottom gradient so content blends into #101010 */}
          <LinearGradient
            colors={["transparent", "rgba(16,16,16,0.65)", "#101010"]}
            locations={[0.42, 0.76, 1]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: POSTER_HEIGHT * 0.58,
            }}
          />

          {/* Back button */}
          <TouchableOpacity
            onPress={handleGoBack}
            activeOpacity={0.8}
            style={{
              position: "absolute",
              top: insets.top + 10,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.45)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BackIcon color="#fff" size={22} />
          </TouchableOpacity>

          {/* Bookmark button */}
          <TouchableOpacity
            onPress={handleToggleFavorite}
            disabled={favoriteLoading}
            activeOpacity={0.8}
            style={{
              position: "absolute",
              top: insets.top + 10,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.45)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bookmark color="#fff" size={20} fill={isFavorite ? "#fff" : "transparent"} />
          </TouchableOpacity>
        </View>

        {/* ── Movie info ──────────────────────────────────────────────────── */}
        <View className="px-4" style={{ marginTop: -4 }}>
          <Text
            className="text-white font-bold mb-3"
            style={{ fontSize: 22, lineHeight: 28 }}
            numberOfLines={2}
          >
            {title}
          </Text>

          {/* Meta chips */}
          <View className="flex-row flex-wrap gap-2 mb-5">
            {movie.imdb_rating ? (
              <View
                className="flex-row items-center gap-1 rounded-lg px-3"
                style={{ backgroundColor: "#1F1F1F", paddingVertical: 6 }}
              >
                <Star size={11} color="#FCD34D" fill="#FCD34D" />
                <Text
                  className="text-[#FCD34D] font-semibold"
                  style={{ fontSize: 12, marginLeft: 2 }}
                >
                  {movie.imdb_rating}
                </Text>
              </View>
            ) : null}

            {movie.year ? (
              <View
                className="rounded-lg px-3"
                style={{ backgroundColor: "#1F1F1F", paddingVertical: 6 }}
              >
                <Text className="text-white/60" style={{ fontSize: 12 }}>
                  {movie.year}
                </Text>
              </View>
            ) : null}

            {movie.age_rating ? (
              <View
                className="rounded-lg px-3"
                style={{ backgroundColor: "#1F1F1F", paddingVertical: 6 }}
              >
                <Text className="text-white/60" style={{ fontSize: 12 }}>
                  {movie.age_rating}+
                </Text>
              </View>
            ) : null}

            {durationMins ? (
              <View
                className="rounded-lg px-3"
                style={{ backgroundColor: "#1F1F1F", paddingVertical: 6 }}
              >
                <Text className="text-white/60" style={{ fontSize: 12 }}>
                  {durationMins} мин
                </Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          {description ? (
            <Text className="text-white/60" style={{ fontSize: 14, lineHeight: 22 }}>
              {description}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* Fixed bottom Watch button (hidden while player is open) */}
      {!isPlaying ? (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            paddingTop: 12,
            backgroundColor: "#101010",
          }}
        >
          <TouchableOpacity
            onPress={handlePlayPress}
            disabled={playerLoading}
            activeOpacity={0.85}
            className="bg-[#FF0000] rounded-xl items-center justify-center flex-row gap-2"
            style={{ paddingVertical: 15 }}
          >
            {playerLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <PlayIcon color="#fff" size={20} />
                <Text className="text-white font-semibold" style={{ fontSize: 16 }}>
                  {t("reels.watch")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ═══════════════════════ FULL SCREEN PLAYER ═══════════════════════ */}
      {isPlaying && streamUrl ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#000",
            zIndex: 100,
          }}
        >
          {/* Video layer + tap to toggle controls */}
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={handleTapPlayer}
          >
            <Video
              ref={videoRef}
              source={{ uri: streamUrl }}
              style={{ width: "100%", height: "100%" }}
              shouldPlay={!playerPaused}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            />
          </Pressable>

          {/* Buffering spinner */}
          {playerLoading ? (
            <View
              pointerEvents="none"
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              className="items-center justify-center"
            >
              <ActivityIndicator size="large" color="#FF0000" />
            </View>
          ) : null}

          {/* ── Controls overlay (auto-hide) ── */}
          {controlsVisible ? (
            <>
              {/* Top bar */}
              <LinearGradient
                colors={["rgba(0,0,0,0.82)", "transparent"]}
                pointerEvents="box-none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  paddingTop: insets.top + 16,
                  paddingBottom: 44,
                  paddingHorizontal: 16,
                }}
              >
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => void closePlayer()}
                    activeOpacity={0.8}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "rgba(0,0,0,0.50)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X color="#fff" size={20} />
                  </TouchableOpacity>

                  <Text
                    className="text-white font-semibold flex-1 text-center"
                    style={{ fontSize: 15 }}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>

                  {/* Spacer so title stays centered */}
                  <View style={{ width: 40 }} />
                </View>
              </LinearGradient>

              {/* Center: skip-back / play-pause / skip-forward */}
              <View
                pointerEvents="box-none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 44 }}>
                  <TouchableOpacity onPress={() => void skipSeconds(-10)} activeOpacity={0.7}>
                    <SkipBackIcon size={46} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={togglePause}
                    activeOpacity={0.8}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: "rgba(255,255,255,0.18)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {playerPaused ? (
                      <PlayIcon size={32} color="#fff" />
                    ) : (
                      <PauseIcon size={28} color="#fff" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => void skipSeconds(10)} activeOpacity={0.7}>
                    <SkipForwardIcon size={46} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom bar: progress + time */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.88)"]}
                pointerEvents="box-none"
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingTop: 56,
                  paddingBottom: Math.max(insets.bottom, 16) + 16,
                  paddingHorizontal: 20,
                }}
              >
                {/* Seekable track */}
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.28)",
                    marginBottom: 10,
                  }}
                  onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
                  onStartShouldSetResponder={() => true}
                  onResponderGrant={(e) => void handleSeek(e.nativeEvent.locationX)}
                  onResponderMove={(e) => void handleSeek(e.nativeEvent.locationX)}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      backgroundColor: "#FF0000",
                      borderRadius: 2,
                    }}
                  />
                </View>

                {/* Time labels */}
                <View className="flex-row justify-between">
                  <Text className="text-white/70" style={{ fontSize: 12 }}>
                    {formatClock(positionMs)}
                  </Text>
                  <Text className="text-white/70" style={{ fontSize: 12 }}>
                    {formatClock(durationMs)}
                  </Text>
                </View>
              </LinearGradient>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
