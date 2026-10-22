import { requireData } from '../../lib/requireData'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { AuthSession, LoginInput } from './types'

export async function login(input: LoginInput) {
  const response = await api.post<BaseResponse<AuthSession>>('/auth/login', input)
  return requireData(response.data, 'Unable to sign in.')
}

export async function refreshSession(refreshToken: string) {
  const response = await api.post<BaseResponse<AuthSession>>('/auth/refresh', { refreshToken })
  return requireData(response.data, 'Unable to refresh session.')
}

export async function logout(refreshToken: string) {
  await api.post('/auth/logout', { refreshToken })
}
