import { verifyForgotPasswordCode } from '@/services/otp.service'
import { useAuthStore } from '@/store/auth/auth.store'
import { useRouter } from 'expo-router'
import { View, Text, TextInput, Pressable } from 'react-native'
import { useState, useRef, useEffect } from 'react'

export default function VerifyResetCode() {
  const router = useRouter()
  const { resetPhone, setResetData } = useAuthStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(48)
  const inputRefs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) return

    const newCode = [...code]
    newCode[index] = text
    setCode(newCode)

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const submit = async () => {
    if (!resetPhone) return

    const fullCode = code.join('')
    if (fullCode.length !== 6) return

    const res = await verifyForgotPasswordCode({
      phone: resetPhone,
      code: fullCode,
    })

    setResetData(resetPhone, res.data.data.reset_token)
    router.push('/(auth)/reset-password')
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <View className="flex-1 bg-black px-6 pt-20">
      <Text className="text-white text-3xl font-semibold mb-3">
        Введите код подтверждения
      </Text>
      
      <Text className="text-[#86868b] text-base mb-10">
        Введите код из SMS, отправленный на номер {resetPhone}
      </Text>

      <View className="flex-row justify-between mb-6">
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            className="bg-[#1c1c1e] text-white text-2xl text-center rounded-xl w-12 h-14"
          />
        ))}
      </View>

      <Text className="text-[#86868b] text-sm text-center mb-12">
        Отправить код повторно можно через {formatTimer(timer)}
      </Text>

      <Pressable 
        onPress={submit} 
        className="bg-[#2c2c2e] py-4 rounded-[14px] active:opacity-80"
      >
        <Text className="text-center text-white font-semibold text-base">
          Подтвердить
        </Text>
      </Pressable>
    </View>
  )
}