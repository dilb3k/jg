import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";

import { useHomeStore } from "@/store/home.store";
import { useI18n } from "@/shared/i18n/useI18n";
import { CategorySection } from "./components/CategorySection";
import { CategoryTabs } from "./components/CategoryTabs";
import { HeroCarousel } from "./components/HeroCarousel";
import { HeroHeader } from "./components/HeroHeader";
import { WatchHistorySection } from "./components/WatchHistorySection";

/* =======================
   SCREEN
======================= */

export default function Home() {
  const { t } = useI18n();
  const carousels = useHomeStore((state) => state.carousels);
  const categories = useHomeStore((state) => state.categories);
  const watchHistory = useHomeStore((state) => state.watchHistory);
  const loading = useHomeStore((state) => state.loading);
  const error = useHomeStore((state) => state.error);
  const fetchData = useHomeStore((state) => state.fetchHomeData);
  const [activeCategory, setActiveCategory] = useState<string>("");

  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<Record<string, number>>({});
  const carouselInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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
  }, [fetchData]);

  useEffect(() => {
    if (categories.length > 0) {
      setActiveCategory((prev) => prev || categories[0].id);
    }
  }, [categories]);

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

  if (error) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center gap-4">
        <Text className="text-gray-400 text-base">{t("home.error")}</Text>
        <TouchableOpacity onPress={fetchData} className="bg-white px-6 py-3 rounded-xl">
          <Text className="text-black font-semibold">{t("common.retry")}</Text>
        </TouchableOpacity>
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

      <HeroHeader />
    </View>
  );
}
