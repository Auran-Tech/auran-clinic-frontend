import { requireData } from '../../lib/requireData'
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

  return requireData(response.data, 'Unable to load patient profile configuration.')
}

export async function getPatientProfile(patientId: string) {
  const response = await api.get<BaseResponse<PatientProfile>>('/patient-profile', {
    params: { patientId },
  })

  return requireData(response.data, 'Unable to load patient profile.')
}

export async function savePatientProfile(input: SavePatientProfileInput) {
  const response = await api.put<BaseResponse<PatientProfile>>('/patient-profile', input)

  return requireData(response.data, 'Unable to save patient profile.')
}
