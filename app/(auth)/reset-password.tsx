import { resetPasswordRequest } from '@/services/otp.service'
import { useAuthStore } from '@/store/auth/auth.store'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

export default function ResetPassword() {
  const router = useRouter()
  const { resetToken, clearResetData } = useAuthStore()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const submit = async () => {
    if (!resetToken || !password || password !== confirmPassword) return

    await resetPasswordRequest({
      reset_token: resetToken,
      new_password: password,
    })

    clearResetData()
    router.replace('/(auth)/login')
  }

  return (
    <View className="flex-1 bg-black px-6 pt-20">
      <Text className="text-white text-3xl font-semibold mb-3">
        Создание нового пароля
      </Text>
      
      <Text className="text-[#86868b] text-base mb-10">
        Введите и подтвердите новый пароль для входа в аккаунт
      </Text>

      <Text className="text-white text-sm mb-2 ml-1">
        Новый пароль
      </Text>

      <View className="relative mb-6">
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Введите пароль"
          placeholderTextColor="#86868b"
          secureTextEntry={!showPassword}
          className="bg-[#1c1c1e] text-white rounded-xl px-4 py-4 pr-12 text-base"
        />
        <Pressable 
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-4"
        >
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={20} 
            color="#86868b" 
          />
        </Pressable>
      </View>

      <Text className="text-white text-sm mb-2 ml-1">
        Подтвердите новый пароль
      </Text>

      <View className="relative mb-12">
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Введите пароль еще раз"
          placeholderTextColor="#86868b"
          secureTextEntry={!showConfirmPassword}
          className="bg-[#1c1c1e] text-white rounded-xl px-4 py-4 pr-12 text-base"
        />
        <Pressable 
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-4 top-4"
        >
          <Ionicons 
            name={showConfirmPassword ? "eye-off" : "eye"} 
            size={20} 
            color="#86868b" 
          />
        </Pressable>
      </View>

      <Pressable 
        onPress={submit} 
        className="bg-white py-4 rounded-[14px] active:opacity-80"
      >
        <Text className="text-center text-black font-semibold text-base">
          Сохранить новый пароль
        </Text>
      </Pressable>
    </View>
  )
}