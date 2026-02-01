import { Video } from "expo-av";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";

import { Reel } from "@/shared/types/reel";
import { HeartIcon } from "@/shared/ui/icons/HeartIcon";
import { PlayIcon } from "@/shared/ui/icons/PlayIcon";
import { ShareIcon } from "@/shared/ui/icons/ShareIcon";
import { useReelStore } from "@/store/reel.store";
import ReelShare from "./ReelShare";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  reel: Reel;
  index: number;
};

export default function ReelItem({ reel, index }: Props) {
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const { currentIndex, setCurrentIndex, toggleLike } = useReelStore();
  const [shareVisible, setShareVisible] = useState(false);

  const isActive = index === currentIndex;

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.playAsync();
    } else {
      videoRef.current.pauseAsync();
      videoRef.current.setPositionAsync(0);
    }
  }, [isActive]);

  const handleGoToMovie = () => {
    const movie = reel.linked_movies?.[0];
    if (!movie?.id) return;

    router.push({
      pathname: "/movie/[id]",
      params: { id: movie.id },
    });
  };

  const likesDisplay =
    reel.likes_count > 9999
      ? `${(reel.likes_count / 1000).toFixed(0)}K`
      : reel.likes_count.toString();

  const title = reel.title_uz || reel.title_ru || reel.title_en || "—";
  const movieTitle =
    reel.linked_movies?.[0]?.title_uz ||
    reel.linked_movies?.[0]?.title_ru ||
    "Film";

  return (
    <View
      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
      className="relative bg-black"
    >
      <Video
        ref={videoRef}
        source={{ uri: reel.flussonic_vod_path ?? "" }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
        isLooping
        shouldPlay={isActive}
        useNativeControls={false}
      />

      <View className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      <View className="absolute bottom-24 left-5 right-5 flex-row items-center gap-3 w-2/3">
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
          {reel.linked_movies?.[0] && (
            <Text className="text-white/80 text-sm font-medium">
              {movieTitle}
            </Text>
          )}
        </View>
      </View>

      <View className="absolute right-4 bottom-24 items-center gap-6">
        <TouchableOpacity
          onPress={() => toggleLike(reel.id)}
          activeOpacity={0.7}
        >
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
            Поделиться
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoToMovie}
          activeOpacity={0.7}
          className="items-center"
        >
          <PlayIcon />
          <Text className="text-white font-semibold mt-2 text-xs">
            Смотреть
          </Text>
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
