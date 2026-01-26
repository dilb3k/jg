import { registerUser } from '@/services/auth.service'
import { sendOtp } from '@/services/otp.service'
import { useAuthStore } from '@/store/auth/auth.store'
import * as Device from 'expo-device'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const formatBirthDate = (d: string) => {
  const [day, month, year] = d.split('.')
  return `${year}-${month}-${day}`
}

const getDeviceId = async () => {
  try {
    if (Platform.OS === 'android') return await Device.osBuildIdAsync()
    return `ios-${Date.now()}`
  } catch {
    return `device-${Date.now()}`
  }
}

export default function Otp() {
  const router = useRouter()
  const { phone, profileData, setAuth, clearRegistrationData } = useAuthStore()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(120)
  const refs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    if (timer <= 0) return
    const t = setTimeout(() => setTimer((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  const submit = async () => {
    const code = otp.join('')
    if (code.length !== 6 || !phone || !profileData) {
      Alert.alert('Xatolik', 'Ma\'lumotlar yetarli emas')
      return
    }

    setLoading(true)
    try {
      const deviceId = await getDeviceId()
      const formattedBirthDate = formatBirthDate(profileData.birth_date)

      const payload = {
        phone,
        code,
        username: profileData.username,
        password: profileData.password,
        full_name: profileData.full_name,
        birth_date: formattedBirthDate,
        device_type: 'mobile',
        device_name: Device.modelName ?? 'unknown',
        device_id: deviceId,
        notification_id: 'string',
      }

      const res = await registerUser(payload)
      const { tokens, user } = res.data.data

      await setAuth({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user,
      })

      clearRegistrationData()
      router.replace('/(tabs)/home')
    } catch (e: any) {
      const errorMsg = e.response?.data?.error?.message || 'OTP noto\'g\'ri'
      const details = e.response?.data?.error?.details

      if (details && Array.isArray(details)) {
        Alert.alert(
          'Xatolik',
          errorMsg + '\n\n' + details.map((d: any) => `• ${d.field}: ${d.message}`).join('\n')
        )
      } else {
        Alert.alert('Xatolik', errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    if (!phone) return

    setLoading(true)
    try {
      await sendOtp(phone)
      setTimer(120)
      setOtp(['', '', '', '', '', ''])
      Alert.alert('Muvaffaqiyatli', 'OTP qayta yuborildi')
    } catch {
      Alert.alert('Xatolik', 'OTP yuborilmadi')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <SafeAreaView className="flex-1 bg-black px-6 py-8 justify-between">
      <View>
        <Text className="text-gray-400 text-sm mb-6">Sign up / OTP</Text>

        <Text className="text-white text-3xl font-semibold mb-2">
          Подтвердите номер телефона
        </Text>

        <Text className="text-gray-400 text-sm mb-6">
          Введите код из SMS
        </Text>

        <View className="flex-row justify-between mb-4">
          {otp.map((v, i) => (
            <TextInput
              key={i}
              ref={(r) => (refs.current[i] = r)}
              value={v}
              onChangeText={(t) => {
                if (!/^\d$/.test(t)) return
                const n = [...otp]
                n[i] = t
                setOtp(n)
                if (i < 5) refs.current[i + 1]?.focus()
              }}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                  refs.current[i - 1]?.focus()
                }
              }}
              keyboardType="number-pad"
              maxLength={1}
              placeholder="•"
              placeholderTextColor="#666"
              className="w-12 h-12 bg-[#1f1f1f] text-white text-center text-xl rounded-xl"
            />
          ))}
        </View>

        <Pressable onPress={resendOtp} disabled={timer > 0 || loading}>
          <Text className={`text-xs text-center ${timer > 0 ? 'text-gray-400' : 'text-blue-400'}`}>
            {timer > 0 
              ? `Отправить код повторно можно через ${formatTime(timer)}` 
              : 'Отправить код повторно'
            }
          </Text>
        </Pressable>
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
            Подтвердить
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  )
}