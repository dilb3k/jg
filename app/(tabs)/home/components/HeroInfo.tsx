import { useI18n } from "@/shared/i18n/useI18n";
import { Movie } from "@/shared/types/movie";
import { Play } from "lucide-react-native";
import { RatingIconLeft } from "@/shared/ui/icons/RatingIconLeft";
import { RatingIconRight } from "@/shared/ui/icons/RatingIconRight";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  movie: Movie;
  onWatchPress: () => void;
}

export function HeroInfo({ movie, onWatchPress }: Props) {
  const { t } = useI18n();
  const ratingValue = Number(movie.imdb_rating);
  const showRating = Number.isFinite(ratingValue) && ratingValue > 0;
  const isHighRating = showRating && ratingValue >= 8;

  return (
    <View className="absolute bottom-0 left-0 right-0 px-4 pb-6">
      <Text className="text-white text-[38px] font-bold mb-2" numberOfLines={1}>
        {movie.title_ru || movie.title_uz || movie.title_en}
      </Text>

      <View className="flex-row items-center mb-4">
        {showRating ? (
          isHighRating ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.75)",
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 8,
                gap: 4,
                borderWidth: 1,
                borderColor: "rgba(212,175,55,0.55)",
                marginRight: 8,
              }}
            >
              <RatingIconLeft size={15} color="#D4AF37" />
              <Text style={{ color: "#D4AF37", fontSize: 12, fontWeight: "700", letterSpacing: 0.2 }}>
                {ratingValue.toFixed(1)}
              </Text>
              <RatingIconRight size={15} color="#D4AF37" />
            </View>
          ) : (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: "#3D9E4A",
                marginRight: 8,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {ratingValue.toFixed(1)}
              </Text>
            </View>
          )
        ) : null}

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
