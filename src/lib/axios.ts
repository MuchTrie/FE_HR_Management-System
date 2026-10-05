import axios from 'axios'
import { clearAuth, getRefreshToken, getToken, setRefreshToken, setToken, setUser } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL
const AUTH_REFRESH_ENABLED = import.meta.env.VITE_AUTH_REFRESH_ENABLED !== 'false'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const refreshToken = getRefreshToken()
    const isRefreshRequest = error.config?.url?.endsWith('/auth/refresh')
    if (error.response?.status === 401 && AUTH_REFRESH_ENABLED && refreshToken && !isRefreshRequest) {
      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
        const session = response.data.data
        setToken(session.token)
        setRefreshToken(session.refresh_token)
        setUser(session.user)
        error.config.headers.Authorization = `Bearer ${session.token}`
        return apiClient.request(error.config)
      } catch {
        clearAuth()
      }
    }
    if (error.response?.status === 401) {
      clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient
