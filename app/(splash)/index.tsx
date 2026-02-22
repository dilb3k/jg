import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useI18n } from '@/shared/i18n/useI18n'
import IntroLoader from './components/IntroLoader'

export default function Splash() {
  const router = useRouter()
  const { t } = useI18n()
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (showIntro) {
    return <IntroLoader />
  }

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
            {t("splash.welcome")}
          </Text>
        </View>

        <Text className="text-gray-400 text-center mb-6">
          {t("splash.subtitle")}
        </Text>

        <Pressable
          onPress={() => router.replace('/login')}
          className="bg-white rounded-2xl py-4 mb-4"
        >
          <Text className="text-black text-center text-lg font-semibold">
            {t("splash.login")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(auth)/register')}
          className="bg-[#2a2a2a] rounded-2xl py-4"
        >
          <Text className="text-white text-center text-lg font-semibold">
            {t("splash.register")}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  )
}
