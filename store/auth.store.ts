import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'

interface ProfileData {
  full_name: string
  username: string
  birth_date: string
  password: string
}

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: any | null
  profileData: ProfileData | null
  phone: string | null
  otpCode: string | null
  resetPhone: string | null
  resetToken: string | null
  hydrated: boolean

  setProfileData: (data: ProfileData) => void
  setPhone: (phone: string) => void
  setOtpCode: (code: string) => void
  clearRegistrationData: () => void
  setResetData: (phone: string, token: string) => void
  clearResetData: () => void
  setAuth: (data: { accessToken: string; refreshToken: string; user: any }) => Promise<void>
  hydrate: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  profileData: null,
  phone: null,
  otpCode: null,
  resetPhone: null,
  resetToken: null,
  hydrated: false,

  setProfileData: (data) => set({ profileData: data }),
  setPhone: (phone) => set({ phone }),
  setOtpCode: (code) => set({ otpCode: code }),
  
  clearRegistrationData: () => set({ 
    profileData: null, 
    phone: null, 
    otpCode: null 
  }),

  setResetData: (phone, token) => set({ resetPhone: phone, resetToken: token }),
  clearResetData: () => set({ resetPhone: null, resetToken: null }),

  setAuth: async ({ accessToken, refreshToken, user }) => {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ])
    set({ accessToken, refreshToken, user })
  },

  hydrate: async () => {
    const [[, accessToken], [, refreshToken], [, user]] =
      await AsyncStorage.multiGet(['accessToken', 'refreshToken', 'user'])
    set({
      accessToken,
      refreshToken,
      user: user ? JSON.parse(user) : null,
      hydrated: true,
    })
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user'])
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      profileData: null,
      phone: null,
      otpCode: null,
      resetPhone: null,
      resetToken: null,
    })
  },
}))