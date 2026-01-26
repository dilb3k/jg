import { useAuthStore } from '@/store/auth/auth.store'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Register() {
  const router = useRouter()
  const { setProfileData } = useAuthStore()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const inputClass = 'bg-[#1f1f1f] text-white rounded-xl px-4 py-4 text-base'

  const formatBirthDate = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) return setBirthDate(digits)
    if (digits.length <= 4) return setBirthDate(`${digits.slice(0, 2)}.${digits.slice(2)}`)
    setBirthDate(`${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`)
  }

  const submit = () => {
    const trimmed = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim()
    }

    if (!trimmed.firstName || !trimmed.lastName) {
      Alert.alert('Xatolik', 'Ism va familiya majburiy')
      return
    }

    if (!/^[a-zA-Z0-9_]{3,32}$/.test(trimmed.username)) {
      Alert.alert('Xatolik', 'Username 3-32 belgi, faqat harf, raqam va _ bo\'lishi kerak')
      return
    }

    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(birthDate)) {
      Alert.alert('Xatolik', 'Sana DD.MM.YYYY formatda bo\'lishi kerak')
      return
    }

    if (password.length < 6) {
      Alert.alert('Xatolik', 'Parol kamida 6 ta belgi bo\'lishi kerak')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Xatolik', 'Parollar mos emas')
      return
    }

    setProfileData({
      full_name: `${trimmed.firstName} ${trimmed.lastName}`,
      username: trimmed.username,
      birth_date: birthDate,
      password,
    })

    router.push('/(auth)/phone')
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        className="px-6"
        contentContainerStyle={{ paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-gray-400 text-sm mb-2">Sign up</Text>

        <Text className="text-white text-3xl font-semibold mb-1">
          Создание профиля
        </Text>

        <Text className="text-gray-400 text-sm mb-8">
          Заполните данные для регистрации
        </Text>

        {/* Имя */}
        <Text className="text-gray-400 text-sm mb-2">Имя</Text>
        <TextInput
          placeholder="Введите имя"
          placeholderTextColor="#666"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          className={inputClass}
        />

        {/* Фамилия */}
        <Text className="text-gray-400 text-sm mb-2 mt-4">Фамилия</Text>
        <TextInput
          placeholder="Введите фамилию"
          placeholderTextColor="#666"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          className={inputClass}
        />

        {/* Username */}
        <Text className="text-gray-400 text-sm mb-2 mt-4">Username</Text>
        <TextInput
          placeholder="Введите username"
          placeholderTextColor="#666"
          value={username}
          onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
          autoCapitalize="none"
          className={inputClass}
        />

        {/* Дата рождения */}
        <Text className="text-gray-400 text-sm mb-2 mt-4">Дата рождения</Text>
        <View className="relative">
          <TextInput
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor="#666"
            value={birthDate}
            onChangeText={formatBirthDate}
            keyboardType="number-pad"
            className={inputClass + ' pr-12'}
          />
          <Ionicons
            name="calendar-outline"
            size={20}
            color="#666"
            style={{ position: 'absolute', right: 16, top: 18 }}
          />
        </View>

        {/* Пароль */}
        <Text className="text-gray-400 text-sm mb-2 mt-4">Пароль</Text>
        <TextInput
          placeholder="Введите пароль (минимум 6 символов)"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          className={inputClass}
        />

        {/* Подтвердите пароль */}
        <Text className="text-gray-400 text-sm mb-2 mt-4">Подтвердите пароль</Text>
        <TextInput
          placeholder="Введите пароль еще раз"
          placeholderTextColor="#666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          className={inputClass}
        />

        <Pressable onPress={submit} className="bg-white rounded-2xl py-4 mt-8">
          <Text className="text-black text-center text-lg font-semibold">
            Зарегистрироваться
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}