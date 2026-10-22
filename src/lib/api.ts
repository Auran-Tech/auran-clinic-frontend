import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, readSession, writeSession } from '../features/auth/storage'
import type { BaseResponse } from '../types/api'
import type { AuthSession } from '../features/auth/types'
import { isSameSession, SessionChangedError } from './sessionGuards'
import { apiBaseUrl } from './apiConfig'
import {
  isTransientConnectionFailure,
  reportConnectionFailure,
} from './connectionSignals'
import { requireData } from './requireData'

export const apiRequestTimeoutMs = 20_000

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: apiRequestTimeoutMs,
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
      .post<BaseResponse<AuthSession>>(
        `${apiBaseUrl}/auth/refresh`,
        {
          refreshToken: expectedRefreshToken,
        },
        {
          timeout: apiRequestTimeoutMs,
        },
      )
      .then((response) => {
        // A logout or another login may have happened while refresh was in flight.
        // Never resurrect the old identity or overwrite the replacement session.
        if (!isSameSession(readSession(), expectedRefreshToken)) {
          throw new SessionChangedError()
        }
        const refreshed = requireData(response.data, 'Session refresh failed.')
        writeSession(refreshed)
        return refreshed
      })
      .catch((error) => {
        reportConnectionFailure(error)
        throw error
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
    reportConnectionFailure(error)
    const original = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

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
      if (
        !isTransientConnectionFailure(refreshError) &&
        isSameSession(readSession(), expectedRefreshToken)
      ) {
        clearSession()
        window.dispatchEvent(new Event('auran:session-expired'))
      }
      return Promise.reject(refreshError)
    }
  },
)
