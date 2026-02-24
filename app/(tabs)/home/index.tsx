import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/shared/i18n/useI18n";
import { useHomeStore } from "@/store/home.store";
import { CategorySection } from "./components/CategorySection";
import { CategoryTabs } from "./components/CategoryTabs";
import { HeroCarousel } from "./components/HeroCarousel";
import { HeroHeader } from "./components/HeroHeader";
import { WatchHistorySection } from "./components/WatchHistorySection";

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = 64;
  const TABS_HEIGHT = 56;

  const carousels = useHomeStore((state) => state.carousels);
  const categories = useHomeStore((state) => state.categories);
  const homeSections = useHomeStore((state) => state.homeSections);
  const watchHistory = useHomeStore((state) => state.watchHistory);
  const loading = useHomeStore((state) => state.loading);
  const error = useHomeStore((state) => state.error);
  const fetchData = useHomeStore((state) => state.fetchHomeData);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [tabsPinned, setTabsPinned] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<Record<string, number>>({});
  const carouselInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const tabsAnchorY = useRef(0);
  const tabsPinnedRef = useRef(false);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);

    if (categoryId === "all") {
      router.push({
        pathname: "/(tabs)/home/category/[id]",
        params: { id: "all", title: t("search.all") },
      });
      return;
    }

    const selectedCategory = categories.find((category) => category.id === categoryId);
    if (!selectedCategory) return;

    router.push({
      pathname: "/(tabs)/home/category/[id]",
      params: { id: selectedCategory.id, title: selectedCategory.title },
    });
  };

  const handleCategoryLayout = (categoryId: string, y: number) => {
    categoryRefs.current[categoryId] = y;
  };

  const handleCarouselSelect = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= carousels.length) return;
    setCurrentCarouselIndex(nextIndex);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const pinThreshold = Math.max(tabsAnchorY.current - (insets.top + HEADER_HEIGHT), 0);
    const shouldPin = y >= pinThreshold;

    if (shouldPin !== tabsPinnedRef.current) {
      tabsPinnedRef.current = shouldPin;
      setTabsPinned(shouldPin);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (categories.length > 0) return;
    setActiveCategory("all");
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#101010] justify-center items-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#FF0000" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-[#101010] justify-center items-center gap-4" edges={["top"]}>
        <Text className="text-gray-400 text-base">{t("home.error")}</Text>
        <TouchableOpacity onPress={fetchData} className="bg-white px-6 py-3 rounded-xl">
          <Text className="text-black font-semibold">{t("common.retry")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentCarousel = carousels[currentCarouselIndex];
  const resolvedHomeSections = homeSections.map((section) => {
    if (section.source === "popular") {
      return { ...section, title: t("home.popular") };
    }
    if (section.source === "latest") {
      return { ...section, title: t("home.latest") };
    }
    return section;
  });

  const categoryTabProps = {
    categories: [
      { id: "all", title: t("search.all") },
      ...categories.map((c) => ({ id: c.id, title: c.title })),
    ],
    active: activeCategory,
    onChange: scrollToCategory,
  };

  return (
    <SafeAreaView className="flex-1 bg-[#101010]" edges={[]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {tabsPinned ? (
        <View
          className="absolute left-0 right-0 top-0 z-40 bg-[#101010]"
          style={{ height: insets.top }}
        />
      ) : null}

      <View
        className={`absolute left-0 right-0 z-30 ${tabsPinned ? "bg-[#101010]" : "bg-transparent"}`}
        style={{ top: insets.top }}
      >
        <HeroHeader />
        {tabsPinned ? <CategoryTabs {...categoryTabProps} /> : null}
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {currentCarousel ? (
          <HeroCarousel
            carousel={currentCarousel}
            index={currentCarouselIndex}
            total={carousels.length}
            onSelect={handleCarouselSelect}
          />
        ) : null}

        <View
          style={{ opacity: tabsPinned ? 0 : 1 }}
          onLayout={(e) => {
            tabsAnchorY.current = e.nativeEvent.layout.y;
          }}
        >
          <CategoryTabs {...categoryTabProps} />
        </View>

        <View style={{ paddingBottom: Math.max(80, insets.bottom + 58) }}>
          {resolvedHomeSections.map((section, index) => (
            <View key={section.id}>
              <CategorySection
                category={section}
                onLayout={(y) => handleCategoryLayout(section.id, y)}
              />

              {index === 1 ? <WatchHistorySection items={watchHistory} /> : null}
            </View>
          ))}

          {resolvedHomeSections.length <= 1 ? <WatchHistorySection items={watchHistory} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
