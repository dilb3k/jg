import { Movie } from "@/shared/types/movie";
import { RatingIconLeft } from "@/shared/ui/icons/RatingIconLeft";
import { RatingIconRight } from "@/shared/ui/icons/RatingIconRight";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Props {
  movie: Movie;
  onPress?: () => void;
  grid?: boolean;
}

export function MovieCard({ movie, onPress, grid = false }: Props) {
  const ratingValue = Number(movie.imdb_rating);
  const showRating = Number.isFinite(ratingValue) && ratingValue > 0;
  const isHighRating = showRating && ratingValue >= 8;

  return (
    <TouchableOpacity
      className={grid ? "mb-4 min-w-[150px]" : "mr-3"}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="relative">
        <Image
          source={{ uri: movie.poster_url }}
          className={grid ? "w-full h-56 rounded-xl" : "w-32 h-48 rounded-xl"}
          resizeMode="cover"
        />

        {showRating ? (
          isHighRating ? (
            // ── High rating (≥ 8): dark badge, top-LEFT, laurel leaves ──
            <View
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.75)",
                paddingHorizontal: 7,
                paddingVertical: 5,
                borderRadius: 8,
                gap: 4,
                borderWidth: 1,
                borderColor: "rgba(212,175,55,0.55)",
              }}
            >
              <RatingIconLeft size={15} color="#D4AF37" />
              <Text
                style={{
                  color: "#D4AF37",
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.2,
                }}
              >
                {ratingValue.toFixed(1)}
              </Text>
              <RatingIconRight size={15} color="#D4AF37" />
            </View>
          ) : (
            // ── Low rating (< 8): green badge, top-LEFT ──
            <View
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: "#3D9E4A",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {ratingValue.toFixed(1)}
              </Text>
            </View>
          )
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
