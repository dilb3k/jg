import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, View } from "react-native";

import { api } from "@/services/api";
import { Movie } from "@/shared/types/movie";
import { WatchHistoryItem } from "@/shared/types/watch-history";

import { CategorySection } from "./components/CategorySection";
import { CategoryTabs } from "./components/CategoryTabs";
import { HeroCarousel } from "./components/HeroCarousel";
import { WatchHistorySection } from "./components/WatchHistorySection";

/* =======================
   TYPES (LOCAL)
======================= */

export interface Carousel {
  id: string;
  poster_url: string;
  movie: Movie;
}

export interface Category {
  id: string;
  title: string;
  movies: Movie[];
}

/* =======================
   SCREEN
======================= */

export default function Home() {
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");

  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<Record<string, number>>({});
  const carouselInterval = useRef<NodeJS.Timeout | null>(null);

  /* =======================
     FETCH DATA
  ======================= */

  const fetchData = async () => {
    try {
      setLoading(true);

      const [carouselRes, genresRes, historyRes] = await Promise.allSettled([
        api.get("/api/v1/carousels"),
        api.get("/api/v1/movies/genres"),
        api.get("/api/v1/history/continue-watching?limit=10"),
      ]);

      /* ---------- CAROUSELS ---------- */
      if (
        carouselRes.status === "fulfilled" &&
        carouselRes.value.data?.success
      ) {
        setCarousels(carouselRes.value.data.data);
      }

      /* ---------- WATCH HISTORY ---------- */
      if (historyRes.status === "fulfilled" && historyRes.value.data?.success) {
        setWatchHistory(historyRes.value.data.data);
      }

      /* ---------- GENRES + MOVIES ---------- */
      if (genresRes.status === "fulfilled" && genresRes.value.data?.success) {
        const genres = genresRes.value.data.data.items;

        const genreCategories: Category[] = await Promise.all(
          genres.map(async (genre: any) => {
            const moviesRes = await api.get(
              `/api/v1/movies/by-genre/${genre.id}?page=1&per_page=20`,
            );

            const data = moviesRes.data.data;

            return {
              id: genre.id,
              title: genre.name,
              movies: Array.isArray(data) ? data : (data.items ?? []),
            };
          }),
        );

        setCategories(genreCategories);

        if (genreCategories.length > 0) {
          setActiveCategory(genreCategories[0].id);
        }
      }
    } catch (e) {
      console.log("HOME FETCH ERROR ❌", e);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     CATEGORY SCROLL
  ======================= */

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);

    const yOffset = categoryRefs.current[categoryId];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: yOffset,
        animated: true,
      });
    }
  };

  const handleCategoryLayout = (categoryId: string, y: number) => {
    categoryRefs.current[categoryId] = y;
  };

  /* =======================
     EFFECTS
  ======================= */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (carousels.length === 0) return;

    carouselInterval.current = setInterval(() => {
      setCurrentCarouselIndex((prev) => (prev + 1) % carousels.length);
    }, 4000);

    return () => {
      if (carouselInterval.current) {
        clearInterval(carouselInterval.current);
      }
    };
  }, [carousels.length]);

  /* =======================
     LOADING
  ======================= */

  if (loading) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  const currentCarousel = carousels[currentCarouselIndex];

  /* =======================
     RENDER
  ======================= */

  return (
    <View className="flex-1 bg-[#101010]">
      <StatusBar barStyle="light-content" />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* 0 — HERO CAROUSEL */}
        {currentCarousel && (
          <HeroCarousel
            carousel={currentCarousel}
            index={currentCarouselIndex}
            total={carousels.length}
          />
        )}

        {/* 1 — CATEGORY TABS */}
        <CategoryTabs
          categories={categories.map((c) => ({
            id: c.id,
            title: c.title,
          }))}
          active={activeCategory}
          onChange={scrollToCategory}
        />

        {/* 2 — CATEGORY SECTIONS + WATCH HISTORY */}
        <View className="pb-20">
          {categories.map((category, index) => (
            <View key={category.id}>
              <CategorySection
                category={category}
                onLayout={(y) => handleCategoryLayout(category.id, y)}
              />

              {/* 🔥 HAR 2 TA CATEGORY’DAN KEYIN */}
              {(index + 1) % 2 === 0 && (
                <WatchHistorySection items={watchHistory} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
