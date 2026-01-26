import { useEffect, useState, useRef } from 'react'
import {
  View,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native'
import { api } from '@/services/api'

import { HeroCarousel } from './components/HeroCarousel'
import { CategorySection } from './components/CategorySection'

const { height } = Dimensions.get('window')

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
  views_count: number
}

export interface Carousel {
  id: string
  movie_id: string
  poster_url: string
  order_number: number
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
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /* =======================
     FETCH DATA
  ======================= */

  const fetchData = async () => {
    try {
      setLoading(true)

      const [carouselRes, popularRes, latestRes] = await Promise.all([
        api.get('/api/v1/carousels'),
        api.get('/api/v1/movies/popular?page=1&per_page=20'),
        api.get('/api/v1/movies/latest?page=1&per_page=20'),
      ])

      if (carouselRes.data.success) {
        setCarousels(carouselRes.data.data)
      }

      const newCategories: Category[] = []

      if (popularRes.data.success) {
        newCategories.push({
          id: 'popular',
          title: 'Популярно',
          movies: popularRes.data.data,
        })

        newCategories.push({
          id: 'comedy',
          title: 'Комедия',
          movies: popularRes.data.data.slice(5, 10),
        })

        newCategories.push({
          id: 'bestseller',
          title: 'Бестселлер недели',
          movies: popularRes.data.data.slice(10, 15),
        })
      }

      if (latestRes.data.success) {
        newCategories.push({
          id: 'new',
          title: 'Новинки',
          movies: latestRes.data.data,
        })

        newCategories.push({
          id: 'fantasy',
          title: 'Фэнтесика',
          movies: latestRes.data.data.slice(5, 10),
        })

        newCategories.push({
          id: 'trailers',
          title: 'Новые трейлеры',
          movies: latestRes.data.data.slice(10, 15),
        })
      }

      setCategories(newCategories)
    } catch (error) {
      console.log('FETCH ERROR:', error)
    } finally {
      setLoading(false)
    }
  }

  /* =======================
     EFFECTS
  ======================= */

  useEffect(() => {
    fetchData()

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (carousels.length > 0) {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentCarouselIndex((prev) =>
          (prev + 1) % carousels.length
        )
      }, 4000)
    }

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current)
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        {currentCarousel && (
          <HeroCarousel
            carousel={currentCarousel}
            index={currentCarouselIndex}
            total={carousels.length}
          />
        )}

        {/* CATEGORIES */}
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
