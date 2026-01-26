import { sendOtp } from '@/services/otp.service'
import { useAuthStore } from '@/store/auth/auth.store'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 12 || !digits.startsWith('998')) return null
  return `+${digits}`
}

export default function Phone() {
  const router = useRouter()
  const { setPhone, profileData } = useAuthStore()
  const [phone, setPhoneLocal] = useState('+998')
  const [loading, setLoading] = useState(false)

  const inputClass = 'bg-[#1f1f1f] text-white rounded-xl px-4 py-4 text-base'

  const submit = async () => {
    if (!profileData) {
      Alert.alert('Xatolik', 'Profil to\'ldirilmagan')
      return
    }

    const normalized = normalizePhone(phone)
    if (!normalized) {
      Alert.alert('Xatolik', 'Telefon +998XXXXXXXXX formatda bo\'lishi kerak')
      return
    }

    setLoading(true)
    try {
      await sendOtp(normalized)
      setPhone(normalized)
      router.push('/(auth)/otp')
    } catch {
      Alert.alert('Xatolik', 'OTP yuborilmadi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-black px-6 py-8 justify-between">
      <View>
        <Text className="text-gray-400 text-sm mb-6">Sign up / Phone number</Text>

        <Text className="text-white text-3xl font-semibold mb-2">
          Введите номер телефона
        </Text>

        <Text className="text-gray-400 text-sm mb-6">
          Введите свой номер, чтобы продолжить регистрацию
        </Text>

        <TextInput
          placeholder="+998"
          keyboardType="phone-pad"
          placeholderTextColor="#666"
          value={phone}
          onChangeText={setPhoneLocal}
          maxLength={13}
          className={inputClass}
        />

        <Text className="text-xs text-gray-400 mt-4">
          Я принимаю{' '}
          <Text className="text-blue-400">Пользовательское соглашение</Text>
          {' '}и{' '}
          <Text className="text-blue-400">Политику конфиденциальности</Text>
        </Text>
      </View>

      <Pressable
        onPress={submit}
        disabled={loading}
        className={`rounded-2xl py-4 ${loading ? 'bg-gray-700' : 'bg-white'}`}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text className="text-black text-center text-lg font-semibold">
            Отправить код
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  )
}