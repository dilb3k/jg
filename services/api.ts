import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://temirovv.uz',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'uz',
  },
})

/* =====================
   REQUEST LOGGER
===================== */
api.interceptors.request.use(
  (config) => {
    console.log('➡️ REQUEST:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    })
    return config
  },
  (error) => {
    console.log('❌ REQUEST ERROR:', error)
    return Promise.reject(error)
  }
)

/* =====================
   RESPONSE LOGGER
===================== */
api.interceptors.response.use(
  (response) => {
    console.log('✅ RESPONSE:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    })
    return response
  },
  (error) => {
    console.log('❌ RESPONSE ERROR:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    })
    return Promise.reject(error)
  }
)
