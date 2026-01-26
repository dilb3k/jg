import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'


export default function Splash() {
  const router = useRouter()
  const [showIntro, setShowIntro] = useState(true)

  // ⏱ 3 SEKUND INTRO
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  /* =====================
     1️⃣ INTRO LOGO ONLY
     ===================== */
  if (showIntro) {
    return (
      <View className="flex-1 bg-black items-center justify-center">

        <View className='flex justify-center items-center'>
          <Image
            source={require('../../assets/images/bigLogo.png')}
          />
        </View>

      </View>
    )
  }

  /* =====================
     2️⃣ SPLASH UI (SENIKI)
     ===================== */
  return (
    <View className="flex-1 bg-black">
      {/* IMAGE 60% */}
      <View className="h-[60%] w-full">
        <Image
          source={require('../../assets/images/splash_bg.png')}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* GRADIENT */}
      <View className="absolute top-[40%] w-full h-[20%]">
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', '#000']}
          className="w-full h-full"
        />
      </View>

      {/* BOTTOM CONTENT */}
      <SafeAreaView className="flex-1 bg-black px-6 pb-10 justify-end">
        {/* LOGO */}
        <View className="items-center">
          <View className="w-[68px] h-[68px] bg-black rounded-xl mb-10 items-center justify-center">
            <Image
              className="w-[36px] h-[36px]"
              source={require('../../assets/images/logo.png')}
            />
          </View>

          <Text className="text-white text-2xl font-bold text-center">
            Добро пожаловать{'\n'}в StarCinema
          </Text>
        </View>

        <Text className="text-gray-400 text-center mb-6">
          Смотрите фильмы и рилсы в одном приложении.{'\n'}
          Войдите, чтобы продолжить
        </Text>

        <Pressable
          onPress={() => router.replace('/login')}
          className="bg-white rounded-2xl py-4 mb-4"
        >
          <Text className="text-black text-center text-lg font-semibold">
            Войти
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(auth)/register')}
          className="bg-[#2a2a2a] rounded-2xl py-4"
        >
          <Text className="text-white text-center text-lg font-semibold">
            Зарегистрироваться
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  )
}
