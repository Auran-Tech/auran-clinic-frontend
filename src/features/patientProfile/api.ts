import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  PatientProfile,
  PatientProfileConfiguration,
  SavePatientProfileInput,
} from './types'

export async function getPatientProfileConfiguration() {
  const response = await api.get<BaseResponse<PatientProfileConfiguration>>(
    '/patient-profile/configuration',
  )

  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to load patient profile configuration.')
  }

  return response.data.data
}

export async function getPatientProfile(patientId: string) {
  const response = await api.get<BaseResponse<PatientProfile>>('/patient-profile', {
    params: { patientId },
  })

  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to load patient profile.')
  }

  return response.data.data
}

export async function savePatientProfile(input: SavePatientProfileInput) {
  const response = await api.put<BaseResponse<PatientProfile>>('/patient-profile', input)

  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to save patient profile.')
  }

  return response.data.data
}
