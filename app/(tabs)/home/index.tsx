import { useEffect, useRef, useState } from 'react'
import {
  View,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native'

import { api } from '@/services/api'
import { HeroCarousel } from './components/HeroCarousel'
import { CategorySection } from './components/CategorySection'
import { CategoryTabs } from './components/CategoryTabs'

/* =======================
   TYPES
======================= */

export interface Movie {
  id: string
  title_uz: string
  title_ru: string
  title_en: string
  year: number
  duration_seconds: number
  age_rating: number
  poster_url: string
  imdb_rating: string
}

export interface Carousel {
  id: string
  poster_url: string
  movie: Movie
}

export interface Category {
  id: string
  title: string
  movies: Movie[]
}

/* =======================
   SCREEN
======================= */

export default function Home() {
  const [carousels, setCarousels] = useState<Carousel[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')

  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const carouselInterval = useRef<NodeJS.Timeout | null>(null)

  /* =======================
     FETCH
  ======================= */

  const fetchData = async () => {
    try {
      setLoading(true)

      const [carouselRes, genresRes] = await Promise.all([
        api.get('/api/v1/carousels'),
        api.get('/api/v1/movies/genres'),
      ])

      if (carouselRes.data.success) {
        setCarousels(carouselRes.data.data)
      }

      if (genresRes.data.success) {
        const genres = genresRes.data.data.items

        const genreCategories: Category[] = await Promise.all(
          genres.map(async (genre: any) => {
            const moviesRes = await api.get(
              `/api/v1/movies?genre=${genre.slug}&page=1&per_page=10`
            )

            return {
              id: genre.id,
              title: genre.name,
              movies: moviesRes.data.success
                ? moviesRes.data.data
                : [],
            }
          })
        )

        setCategories(genreCategories)
        setActiveCategory(genreCategories[0]?.id)
      }
    } catch (e) {
      console.log('FETCH ERROR', e)
    } finally {
      setLoading(false)
    }
  }

  /* =======================
     EFFECTS
  ======================= */

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (carousels.length > 0) {
      carouselInterval.current = setInterval(() => {
        setCurrentCarouselIndex((prev) =>
          (prev + 1) % carousels.length
        )
      }, 4000)
    }

    return () => {
      if (carouselInterval.current) {
        clearInterval(carouselInterval.current)
      }
    }
  }, [carousels.length])

  /* =======================
     LOADING
  ======================= */

  if (loading) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    )
  }

  const currentCarousel = carousels[currentCarouselIndex]

  /* =======================
     RENDER
  ======================= */

  return (
    <View className="flex-1 bg-[#101010]">
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]} // 👈 CATEGORY FIXED
      >
        {/* 0 — HERO */}
        {currentCarousel && (
          <HeroCarousel
            carousel={currentCarousel}
            index={currentCarouselIndex}
            total={carousels.length}
          />
        )}

        {/* 1 — FIXED CATEGORY */}
        <CategoryTabs
          categories={categories.map((c) => ({
            id: c.id,
            title: c.title,
          }))}
          active={activeCategory}
          onChange={setActiveCategory}
        />

        {/* 2 — LIST */}
        <View className="pb-20">
          {categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
