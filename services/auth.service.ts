import { api } from './api'

export interface RegisterPayload {
  phone: string
  username: string
  password: string
  code: string
  full_name: string
  birth_date: string
  device_type: string
  device_name: string
  device_id: string
  notification_id: string
}

export const registerUser = (payload: RegisterPayload) =>
  api.post('/api/v1/auth/register', payload)

export const refreshTokens = (refreshToken: string) =>
  api.post('/api/v1/auth/refresh', { refresh_token: refreshToken })

/* LOGIN — TEGMAYMIZ */
export const loginUser = (payload: {
  login_type: 'phone' | 'username'
  phone?: string
  username?: string
  password: string
  device_id: string
  device_type: string
  device_name: string
  notification_id: string
}) => api.post('/api/v1/auth/login', payload)

interface CheckAvailabilityResponse {
  success: boolean
  data: {
    exists: boolean
  }
}

export const checkUsernameAvailability = async (username: string) => {
  const res = await api.post<CheckAvailabilityResponse>('/api/v1/auth/check/username', {
    username: username.toLowerCase(),
  })
  return res.data.data.exists
}

export const checkPhoneAvailability = async (phone: string) => {
  const res = await api.post<CheckAvailabilityResponse>('/api/v1/auth/check/phone', {
    phone,
  })
  return res.data.data.exists
}
