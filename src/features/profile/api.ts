import { api } from '../../lib/api'
import axios from 'axios'
import { requireData } from '../../lib/requireData'
import type { BaseResponse } from '../../types/api'

export interface Profile {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  isSuperUser: boolean
  roles: string[]
}

export interface UpdateProfileInput {
  fullName: string
  email: string
}

export interface OwnSession {
  id: string
  createdDate: string
  expiresDate: string
  isCurrent: boolean
}

export async function getProfile() {
  const response = await api.get<BaseResponse<Profile>>('/users/me')
  return requireData(response.data, 'Unable to load your profile.')
}

export async function updateProfile(input: UpdateProfileInput) {
  const response = await api.put<BaseResponse<Profile>>('/users/me', input)
  return requireData(response.data, 'Unable to save your profile.')
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await api.post('/users/me/password', { currentPassword, newPassword })
}

export async function getOwnSessions() {
  const response = await api.get<BaseResponse<OwnSession[]>>('/users/me/sessions')
  return response.data.data ?? []
}

export async function revokeOwnSession(sessionId: string) {
  await api.post('/users/me/sessions/revoke', { sessionId })
}

export async function revokeAllOwnSessions() {
  await api.post('/users/me/sessions/revoke-all')
}

export async function getProfilePhoto() {
  try {
    const response = await api.get<Blob>('/users/me/photo', {
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export async function uploadProfilePhoto(file: File) {
  const body = new FormData()
  body.append('file', file)
  await api.post('/users/me/photo', body, {
    headers: { 'Content-Type': undefined },
  })
}
