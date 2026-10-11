import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  ClinicSettings,
  ClinicSettingsLookups,
  UpdateClinicSettingsInput,
} from './types'

export async function getClinicSettings() {
  const response = await api.get<BaseResponse<ClinicSettings>>('/settings')
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to load clinic settings.')
  }
  return response.data.data
}

export async function getClinicSettingsLookups() {
  const response = await api.get<BaseResponse<ClinicSettingsLookups>>('/settings/lookups')
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to load settings lookups.')
  }
  return response.data.data
}

export async function updateClinicSettings(input: UpdateClinicSettingsInput) {
  const response = await api.put<BaseResponse<ClinicSettings>>('/settings', input)
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to update clinic settings.')
  }
  return response.data.data
}
