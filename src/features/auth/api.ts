import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { AuthSession, LoginInput } from './types'

export async function login(input: LoginInput) {
  const response = await api.post<BaseResponse<AuthSession>>('/auth/login', input)
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to sign in.')
  }
  return response.data.data
}

export async function refreshSession(refreshToken: string) {
  const response = await api.post<BaseResponse<AuthSession>>('/auth/refresh', { refreshToken })
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to refresh session.')
  }
  return response.data.data
}

export async function logout(refreshToken: string) {
  await api.post('/auth/logout', { refreshToken })
}
