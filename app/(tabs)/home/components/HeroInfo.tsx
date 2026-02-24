import { useI18n } from "@/shared/i18n/useI18n";
import { Movie } from "@/shared/types/movie";
import { Play, Star } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  movie: Movie;
  onWatchPress: () => void;
}

export function HeroInfo({ movie, onWatchPress }: Props) {
  const { t } = useI18n();

  return (
    <View className="absolute bottom-0 left-0 right-0 px-4 pb-6">
      <Text className="text-white text-[38px] font-bold mb-2" numberOfLines={1}>
        {movie.title_ru || movie.title_uz || movie.title_en}
      </Text>

      <View className="flex-row items-center mb-4">
        <View className="flex-row items-center bg-black/45 rounded-md px-2 py-1 mr-2">
          <Star color="#FCD34D" fill="#FCD34D" size={13} />
          <Text className="text-[#FCD34D] text-xs font-semibold ml-1">{movie.imdb_rating ?? "-"}</Text>
        </View>

        {movie.year ? <Text className="text-white/70 text-xs mr-2">{movie.year}</Text> : null}
        {movie.age_rating ? <Text className="text-white/70 text-xs">{movie.age_rating}+</Text> : null}
      </View>

      <TouchableOpacity
        className="bg-[#FF0000] rounded-xl py-3.5 flex-row justify-center items-center gap-2"
        onPress={onWatchPress}
        activeOpacity={0.85}
      >
        <Play color="white" fill="white" size={18} />
        <Text className="text-white text-base font-semibold">{t("reels.watch")}</Text>
      </TouchableOpacity>
    </View>
  );
}
