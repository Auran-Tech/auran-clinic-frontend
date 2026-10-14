import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, readSession, writeSession } from '../features/auth/storage'
import type { BaseResponse } from '../types/api'
import type { AuthSession } from '../features/auth/types'
import { isSameSession, SessionChangedError } from './sessionGuards'

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
    throw new SessionChangedError()
  }

  if (!refreshPromise) {
    const expectedRefreshToken = session.refreshToken
    const pending = axios
      .post<BaseResponse<AuthSession>>(`${baseURL}/auth/refresh`, {
        refreshToken: expectedRefreshToken,
      })
      .then((response) => {
        // A logout or another login may have happened while refresh was in flight.
        // Never resurrect the old identity or overwrite the replacement session.
        if (!isSameSession(readSession(), expectedRefreshToken)) {
          throw new SessionChangedError()
        }
        if (!response.data.data) {
          throw new Error(response.data.message ?? 'Session refresh failed.')
        }
        writeSession(response.data.data)
        return response.data.data
      })
      .finally(() => {
        if (refreshPromise === pending) refreshPromise = null
      })
    refreshPromise = pending
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

    // A stale request cannot refresh a newer user's credentials.
    const priorAccessToken = original.headers?.Authorization?.toString()
    const current = readSession()
    if (!current || priorAccessToken !== `Bearer ${current.accessToken}`) {
      return Promise.reject(error)
    }

    original._retry = true
    const expectedRefreshToken = current.refreshToken

    try {
      const session = await rotateSession()
      // The user could also log out between rotation and retry.
      if (!isSameSession(readSession(), session.refreshToken)) {
        throw new SessionChangedError()
      }
      original.headers.Authorization = `Bearer ${session.accessToken}`
      return api(original)
    } catch (refreshError) {
      if (isSameSession(readSession(), expectedRefreshToken)) {
        clearSession()
        window.dispatchEvent(new Event('auran:session-expired'))
      }
      return Promise.reject(refreshError)
    }
  },
)
