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
