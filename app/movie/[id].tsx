import { getMovieStream, updateMovieStreamProgress } from "@/services/movie.service";
import { useI18n } from "@/shared/i18n/useI18n";
import { BackIcon } from "@/shared/ui/icons/BackIcon";
import { NotInternetIcon } from "@/shared/ui/icons/NotInternetIcon";
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
import {
  Airplay,
  Bookmark,
  Film,
  Maximize2,
  MoreVertical,
  SkipForward,
  Volume2,
  X,
} from "lucide-react-native";
import { RatingIconLeft } from "@/shared/ui/icons/RatingIconLeft";
import { RatingIconRight } from "@/shared/ui/icons/RatingIconRight";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const POSTER_HEIGHT = Math.round(SCREEN_HEIGHT * 0.48);

type NetworkStatus = "ok" | "slow" | "offline";

export default function MovieDetailPage() {
  const { id, episodeInfo } = useLocalSearchParams<{ id: string; episodeInfo?: string }>();
  const router = useRouter();
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  // ── Progress tracking refs ────────────────────────────────────────────────
  const progressRef = useRef(0);
  const resumedRef = useRef(false);
  const currentPositionRef = useRef(0);
  const currentDurationRef = useRef(0);

  // ── Player state ──────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerPaused, setPlayerPaused] = useState(false);
  const playerPausedRef = useRef(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [resumePosition, setResumePosition] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);

  // ── Controls auto-hide ────────────────────────────────────────────────────
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsVisibleRef = useRef(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [progressBarWidth, setProgressBarWidth] = useState(300);

  // ── Network status ────────────────────────────────────────────────────────
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>("ok");
  const bufferingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPlayedRef = useRef(false);

  // ── Favorites ─────────────────────────────────────────────────────────────
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const movie = useMovieStore((state) => state.movie);
  const loading = useMovieStore((state) => state.loading);
  const fetchMovie = useMovieStore((state) => state.fetchMovie);
  const clear = useMovieStore((state) => state.clear);
  const checkFavorite = useFavoritesStore((state) => state.checkFavorite);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  // ── Derived ───────────────────────────────────────────────────────────────
  const progressPercent = !durationMs
    ? 0
    : Math.max(0, Math.min(100, (positionMs / durationMs) * 100));

  const remainingMs = Math.max(0, durationMs - positionMs);

  // Show "skip intro" for the first 90 s (after 3 s)
  const showSkipIntro =
    isPlaying && positionMs > 3_000 && positionMs < 90_000 && durationMs > 120_000;

  // Show "next episode" in the last 60 s
  const showNextEpisode =
    isPlaying && durationMs > 120_000 && durationMs - positionMs < 60_000;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  const handleGoBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/home");
  };

  useEffect(() => {
    if (!id) return;
    fetchMovie(id);
    return () => clear();
  }, [clear, fetchMovie, id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void checkFavorite(id)
      .then((v) => { if (active) setIsFavorite(v); })
      .catch(() => {});
    return () => { active = false; };
  }, [checkFavorite, id]);

  useEffect(() => {
    if (!isPlaying || !id) return;
    const iv = setInterval(() => {
      const s = Math.floor(progressRef.current / 1000);
      if (s > 0) void updateMovieStreamProgress(id, s);
    }, 15_000);
    return () => clearInterval(iv);
  }, [id, isPlaying]);

  useEffect(() => {
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      if (!id) return;
      const s = Math.floor(progressRef.current / 1000);
      if (s > 0) void updateMovieStreamProgress(id, s);
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
    };
  }, []);

  // ── Controls helpers ──────────────────────────────────────────────────────
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

  const handleSkipIntro = useCallback(() => {
    const target = 90 - Math.floor(positionMs / 1000);
    void skipSeconds(target);
  }, [positionMs, skipSeconds]);

  // ── Playback status ───────────────────────────────────────────────────────
  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        setPlayerLoading(true);
        if (status.error && hasPlayedRef.current) setNetworkStatus("offline");
        return;
      }

      const buffering = Boolean(status.isBuffering);
      setPlayerLoading(buffering);

      const pos = status.positionMillis ?? 0;
      const dur = status.durationMillis ?? 0;
      setPositionMs(pos);
      if (dur) { setDurationMs(dur); currentDurationRef.current = dur; }
      currentPositionRef.current = pos;
      progressRef.current = pos;

      if (!resumedRef.current && resumePosition > 0) {
        resumedRef.current = true;
        void videoRef.current?.setPositionAsync(resumePosition * 1000);
      }

      if (!buffering && pos > 0) hasPlayedRef.current = true;

      // ── Slow / offline detection via prolonged buffering ──
      if (buffering && hasPlayedRef.current) {
        if (!bufferingTimerRef.current) {
          bufferingTimerRef.current = setTimeout(() => {
            setNetworkStatus("slow");
            bufferingTimerRef.current = setTimeout(
              () => setNetworkStatus("offline"),
              7000,
            );
          }, 5000);
        }
      } else if (!buffering) {
        if (bufferingTimerRef.current) {
          clearTimeout(bufferingTimerRef.current);
          bufferingTimerRef.current = null;
        }
        if (networkStatus !== "ok") setNetworkStatus("ok");
      }
    },
    [networkStatus, resumePosition],
  );

  const handleVideoError = useCallback(() => {
    if (hasPlayedRef.current) setNetworkStatus("offline");
  }, []);

  // ── Play press ────────────────────────────────────────────────────────────
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
      hasPlayedRef.current = false;
      playerPausedRef.current = false;
      setPlayerPaused(false);
      setNetworkStatus("ok");
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
    if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
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
    setNetworkStatus("ok");
    hasPlayedRef.current = false;
    currentPositionRef.current = 0;
    currentDurationRef.current = 0;
    progressRef.current = 0;
  };

  const handleToggleFavorite = async () => {
    if (!id || favoriteLoading) return;
    setFavoriteLoading(true);
    const result = await toggleFavorite(id);
    setFavoriteLoading(false);
    if (result === null) { Alert.alert(t("common.errorTitle"), t("common.error")); return; }
    setIsFavorite(result);
  };

  const formatClock = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const p = (n: number) => String(n).padStart(2, "0");
    return hh > 0 ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

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
        <View className="flex-1 justify-center items-center px-6" style={{ marginTop: -60 }}>
          <NotMovieIcon color="#555" size={52} />
          <Text className="text-gray-400 mt-4 text-base">{t("common.noData")}</Text>
        </View>
      </View>
    );
  }

  // ── Localise ──────────────────────────────────────────────────────────────
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

  const durationMins = movie.duration_seconds ? Math.round(movie.duration_seconds / 60) : null;

  // ── Main render ───────────────────────────────────────────────────────────
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
        {/* ── Poster hero ──────────────────────────────────────────────────── */}
        <View style={{ height: POSTER_HEIGHT }}>
          <Image
            source={{ uri: movie.poster_url }}
            style={{ width: "100%", height: POSTER_HEIGHT }}
            resizeMode="cover"
          />
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

        {/* ── Movie info ───────────────────────────────────────────────────── */}
        <View className="px-4" style={{ marginTop: -4 }}>
          <Text
            className="text-white font-bold mb-3"
            style={{ fontSize: 22, lineHeight: 28 }}
            numberOfLines={2}
          >
            {title}
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-5">
            {movie.imdb_rating ? (() => {
              const rv = Number(movie.imdb_rating);
              const high = Number.isFinite(rv) && rv >= 8;
              return high ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.75)",
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 8,
                    gap: 4,
                    borderWidth: 1,
                    borderColor: "rgba(212,175,55,0.55)",
                  }}
                >
                  <RatingIconLeft size={15} color="#D4AF37" />
                  <Text style={{ color: "#D4AF37", fontSize: 12, fontWeight: "700", letterSpacing: 0.2 }}>
                    {rv.toFixed(1)}
                  </Text>
                  <RatingIconRight size={15} color="#D4AF37" />
                </View>
              ) : (
                <View style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: "#3D9E4A" }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                    {Number.isFinite(rv) ? rv.toFixed(1) : movie.imdb_rating}
                  </Text>
                </View>
              );
            })() : null}
            {movie.year ? (
              <View className="rounded-lg px-3" style={{ backgroundColor: "#1F1F1F", paddingVertical: 6 }}>
                <Text className="text-white/60" style={{ fontSize: 12 }}>{movie.year}</Text>
              </View>
            ) : null}
            {movie.age_rating ? (
              <View className="rounded-lg px-3" style={{ backgroundColor: "#1F1F1F", paddingVertical: 6 }}>
                <Text className="text-white/60" style={{ fontSize: 12 }}>{movie.age_rating}+</Text>
              </View>
            ) : null}
            {durationMins ? (
              <View className="rounded-lg px-3" style={{ backgroundColor: "#1F1F1F", paddingVertical: 6 }}>
                <Text className="text-white/60" style={{ fontSize: 12 }}>{durationMins} мин</Text>
              </View>
            ) : null}
          </View>

          {description ? (
            <Text className="text-white/60" style={{ fontSize: 14, lineHeight: 22 }}>
              {description}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* ── Fixed bottom Watch button ─────────────────────────────────────── */}
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

      {/* ═══════════════════════ FULL SCREEN PLAYER ════════════════════════ */}
      {isPlaying && streamUrl ? (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000", zIndex: 100 }]}>

          {/* ── Video ─────────────────────────────────────────────────────── */}
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleTapPlayer}>
            <Video
              ref={videoRef}
              source={{ uri: streamUrl }}
              style={StyleSheet.absoluteFillObject}
              shouldPlay={!playerPaused}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              onError={handleVideoError}
            />
          </Pressable>

          {/* ── Buffering spinner ─────────────────────────────────────────── */}
          {playerLoading ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, s.center]}>
              <ActivityIndicator size="large" color="#FF0000" />
            </View>
          ) : null}

          {/* ── Network status toast ──────────────────────────────────────── */}
          {networkStatus !== "ok" ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, s.center]}>
              <View style={s.networkToast}>
                <NotInternetIcon
                  color={networkStatus === "offline" ? "#fff" : "rgba(255,255,255,0.75)"}
                  size={20}
                />
                <Text style={s.networkToastText}>
                  {networkStatus === "offline"
                    ? "Нет интернет соединения"
                    : "Слабое интернет подключение"}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ── Controls overlay ──────────────────────────────────────────── */}
          {controlsVisible ? (
            <>
              {/* TOP BAR */}
              <LinearGradient
                colors={["rgba(0,0,0,0.80)", "transparent"]}
                pointerEvents="box-none"
                style={s.topBar}
              >
                <View style={s.topBarRow}>
                  {/* Close button */}
                  <TouchableOpacity
                    onPress={() => void closePlayer()}
                    activeOpacity={0.8}
                    style={s.iconBtn}
                  >
                    <X color="#fff" size={20} />
                  </TouchableOpacity>

                  {/* Title + episode info */}
                  <View style={s.titleBlock}>
                    <Text style={s.playerTitle} numberOfLines={1}>{title}</Text>
                    {episodeInfo ? (
                      <Text style={s.playerSubtitle} numberOfLines={1}>{episodeInfo}</Text>
                    ) : null}
                  </View>

                  {/* AirPlay + More */}
                  <View style={s.topRightIcons}>
                    <TouchableOpacity activeOpacity={0.8} style={s.iconBtn}>
                      <Airplay color="#fff" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.8} style={s.iconBtn}>
                      <MoreVertical color="#fff" size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>

              {/* CENTER CONTROLS */}
              <View
                pointerEvents="box-none"
                style={[StyleSheet.absoluteFillObject, s.center]}
              >
                <View style={s.centerControls}>
                  <TouchableOpacity
                    onPress={() => void skipSeconds(-10)}
                    activeOpacity={0.7}
                  >
                    <SkipBackIcon size={46} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={togglePause}
                    activeOpacity={0.8}
                    style={s.playPauseBtn}
                  >
                    {playerPaused
                      ? <PlayIcon size={32} color="#fff" />
                      : <PauseIcon size={28} color="#fff" />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => void skipSeconds(10)}
                    activeOpacity={0.7}
                  >
                    <SkipForwardIcon size={46} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* BOTTOM BAR */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.92)"]}
                pointerEvents="box-none"
                style={s.bottomBar}
              >
                {/* Progress bar + scrubber thumb */}
                <View
                  style={s.progressTrack}
                  onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
                  onStartShouldSetResponder={() => true}
                  onResponderGrant={(e) => void handleSeek(e.nativeEvent.locationX)}
                  onResponderMove={(e) => void handleSeek(e.nativeEvent.locationX)}
                >
                  <View style={[s.progressFilled, { width: `${progressPercent}%` }]} />
                  <View style={[s.progressThumb, { left: `${progressPercent}%` }]} />
                </View>

                {/* Time labels */}
                <View style={s.timeRow}>
                  <Text style={s.timeText}>{formatClock(positionMs)}</Text>
                  <Text style={s.timeText}>-{formatClock(remainingMs)}</Text>
                </View>

                {/* Action buttons */}
                <View style={s.actionRow}>
                  <View style={s.actionLeft}>
                    <TouchableOpacity style={s.actionBtn} activeOpacity={0.75}>
                      <Film color="#fff" size={18} />
                      <Text style={s.actionBtnText}>Серии</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.actionBtn} activeOpacity={0.75}>
                      <Volume2 color="#fff" size={18} />
                      <Text style={s.actionBtnText}>Аудио и субтитры</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.actionRight}>
                    <TouchableOpacity activeOpacity={0.75} style={s.iconBtn}>
                      <Maximize2 color="#fff" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.75} style={s.iconBtn}>
                      <SkipForward color="#fff" size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </>
          ) : null}

          {/* ── Skip intro (shown always when active, not only when controls visible) ── */}
          {showSkipIntro ? (
            <View style={s.skipIntroWrap} pointerEvents="box-none">
              <View style={s.skipIntroRow}>
                <TouchableOpacity activeOpacity={0.8} style={s.btnOutline}>
                  <Text style={s.btnOutlineText}>Смотреть заставку</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={s.btnRed}
                  onPress={handleSkipIntro}
                >
                  <Text style={s.btnRedText}>Пропустить</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* ── Next episode ─────────────────────────────────────────────── */}
          {showNextEpisode ? (
            <View style={s.nextEpisodeWrap} pointerEvents="box-none">
              <TouchableOpacity
                activeOpacity={0.85}
                style={[s.btnRed, s.nextEpisodeBtn]}
                onPress={() => void closePlayer()}
              >
                <SkipForward color="#fff" size={16} />
                <Text style={s.btnRedText}>Следующая серия</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },

  // Network toast
  networkToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  networkToastText: { color: "#fff", fontSize: 13, fontWeight: "500" },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingBottom: 48,
    paddingHorizontal: 12,
  },
  topBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleBlock: { flex: 1, alignItems: "center" },
  playerTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  playerSubtitle: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 },
  topRightIcons: { flexDirection: "row", gap: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  // Center controls
  centerControls: { flexDirection: "row", alignItems: "center", gap: 44 },
  playPauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 8,
    justifyContent: "center",
  },
  progressFilled: { height: "100%", backgroundColor: "#FF0000", borderRadius: 2 },
  progressThumb: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FF0000",
    top: -5,
    marginLeft: -7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 4,
  },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  timeText: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: 20 },
  actionRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "500" },

  // Skip intro
  skipIntroWrap: { position: "absolute", bottom: 100, right: 20 },
  skipIntroRow: { flexDirection: "row", gap: 8 },

  // Next episode
  nextEpisodeWrap: { position: "absolute", bottom: 100, right: 20 },
  nextEpisodeBtn: { flexDirection: "row", alignItems: "center", gap: 6 },

  // Shared buttons
  btnRed: { backgroundColor: "#FF0000", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  btnRedText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  btnOutline: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnOutlineText: { color: "#fff", fontSize: 14, fontWeight: "500" },
});
