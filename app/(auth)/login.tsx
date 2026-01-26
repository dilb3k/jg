import { loginUser } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth/auth.store'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

export default function Login() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [loginType, setLoginType] = useState<'phone' | 'username'>('phone')
  const [phone, setPhone] = useState('+998')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (loginType === 'phone' && (!phone || !password)) return
    if (loginType === 'username' && (!username || !password)) return

    try {
      setLoading(true)

      const payload = {
        login_type: loginType,
        ...(loginType === 'phone' ? { phone } : { username }),
        password,
        device_id: 'A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6',
        device_type: 'mobile',
        device_name: 'iPhone 14 Pro',
        notification_id: 'string',
      }

      const res = await loginUser(payload)
      const { tokens, user } = res.data.data

      await setAuth({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user,
      })

      router.replace('/(tabs)/home')
    } catch (e: any) {
      console.log('LOGIN ERROR:', e.response?.data || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-black px-6 pt-16">
      <Text className="text-white text-2xl font-semibold mb-2">
        Вход по логину и паролю
      </Text>
      <Text className="text-gray-400 text-sm mb-8">
        Введите данные для авторизации
      </Text>

      {/* Toggle Switcher */}
      {/* Toggle Switcher */}
      <View className="bg-[#2c2c2e] rounded-full p-1 flex-row mb-6">
        <Pressable
          onPress={() => setLoginType('phone')}
          className={`flex-1 py-3 rounded-full ${loginType === 'phone' ? 'bg-black' : ''
            }`}
        >
          <Text
            className={`text-center text-sm font-medium ${loginType === 'phone' ? 'text-white' : 'text-gray-400'
              }`}
          >
            Телефон
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setLoginType('username')}
          className={`flex-1 py-3 rounded-full ${loginType === 'username' ? 'bg-black' : ''
            }`}
        >
          <Text
            className={`text-center text-sm font-medium ${loginType === 'username' ? 'text-white' : 'text-gray-400'
              }`}
          >
            Логин
          </Text>
        </Pressable>
      </View>


      {/* Input Field */}
      <View className="mb-4">
        <Text className="text-white text-sm mb-2">
          {loginType === 'phone' ? 'Номер телефона' : 'Username'}
        </Text>
        {loginType === 'phone' ? (
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+998"
            placeholderTextColor="#666"
            className="bg-[#1c1c1e] text-white rounded-xl px-4 py-4"
          />
        ) : (
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="behruz_05"
            placeholderTextColor="#666"
            autoCapitalize="none"
            className="bg-[#1c1c1e] text-white rounded-xl px-4 py-4"
          />
        )}
      </View>

      {/* Password Field */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white text-sm">Пароль</Text>
          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text className="text-blue-500 text-sm">Забыли пароль?</Text>
          </Pressable>
        </View>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Введите пароль"
          placeholderTextColor="#666"
          secureTextEntry
          className="bg-[#1c1c1e] text-white rounded-xl px-4 py-4"
        />
      </View>

      <View className="flex-1" />

      {/* Submit Button */}
      <Pressable
        onPress={submit}
        disabled={loading}
        className="bg-white py-4 rounded-2xl mb-8"
      >
        <Text className="text-center font-semibold text-black text-base">
          {loading ? 'Загрузка..' : 'Войти'}
        </Text>
      </Pressable>
    </View>
  )
}