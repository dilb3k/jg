import { sendForgotPasswordOtp } from '@/services/otp.service'
import { useAuthStore } from '@/store/auth/auth.store'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

export default function ForgotPassword() {
  const router = useRouter()
  const setResetData = useAuthStore((s) => s.setResetData)
  const [phone, setPhone] = useState('+998')

  const submit = async () => {
    await sendForgotPasswordOtp(phone)
    setResetData(phone, '')
    router.push('/(auth)/verify-reset-code')
  }

  return (
    <View className="flex-1 bg-black px-6 pt-20">
      <Text className="text-white text-3xl font-semibold mb-3">
        Восстановление пароля
      </Text>
      
      <Text className="text-[#86868b] text-base mb-8">
        Введите номер телефона, чтобы получить код для восстановления
      </Text>

      <Text className="text-white text-sm mb-2 ml-1">
        номер телефона
      </Text>

      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="+998"
        placeholderTextColor="#86868b"
        keyboardType="phone-pad"
        className="bg-[#1c1c1e] text-white rounded-xl px-4 py-4 text-base mb-8"
      />

      <Pressable 
        onPress={submit} 
        className="bg-white py-4 rounded-[14px] active:opacity-80"
      >
        <Text className="text-center text-black font-semibold text-base">
          Отправить код
        </Text>
      </Pressable>
    </View>
  )
}