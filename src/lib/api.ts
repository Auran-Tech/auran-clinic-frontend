import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, readSession, writeSession } from '../features/auth/storage'
import type { BaseResponse } from '../types/api'
import type { AuthSession } from '../features/auth/types'

const baseURL = import.meta.env.VITE_API_BASE_URL

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is required.')
}

export const api = axios.create({
  baseURL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const session = readSession()
  const language = localStorage.getItem('auran.language')
  config.headers['Accept-Language'] = language === 'ar' ? 'ar' : 'en'

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

let refreshPromise: Promise<AuthSession> | null = null

async function rotateSession() {
  const session = readSession()
  if (!session?.refreshToken) {
    throw new Error('Refresh token is missing.')
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<BaseResponse<AuthSession>>(`${baseURL}/auth/refresh`, {
        refreshToken: session.refreshToken,
      })
      .then((response) => {
        if (!response.data.data) {
          throw new Error(response.data.message ?? 'Session refresh failed.')
        }
        writeSession(response.data.data)
        return response.data.data
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error)
    }

    original._retry = true

    try {
      const session = await rotateSession()
      original.headers.Authorization = `Bearer ${session.accessToken}`
      return api(original)
    } catch (refreshError) {
      clearSession()
      window.dispatchEvent(new Event('auran:session-expired'))
      return Promise.reject(refreshError)
    }
  },
)
