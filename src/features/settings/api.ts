import { requireData } from '../../lib/requireData'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  ClinicSettings,
  ClinicSettingsLookups,
  UpdateClinicSettingsInput,
} from './types'

export async function getClinicSettings() {
  const response = await api.get<BaseResponse<ClinicSettings>>('/settings')
  return requireData(response.data, 'Unable to load clinic settings.')
}

export async function getClinicSettingsLookups() {
  const response = await api.get<BaseResponse<ClinicSettingsLookups>>('/settings/lookups')
  return requireData(response.data, 'Unable to load settings lookups.')
}

export async function updateClinicSettings(input: UpdateClinicSettingsInput) {
  const response = await api.put<BaseResponse<ClinicSettings>>('/settings', input)
  return requireData(response.data, 'Unable to update clinic settings.')
}
