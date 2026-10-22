import { requireData } from '../../lib/requireData'
import { api } from '../../lib/api'
import type { BaseResponse, PaginatedResponse } from '../../types/api'
import type {
  CreatePatientInput,
  Patient,
  PatientDuplicateCandidate,
  PatientQuery,
  UpdatePatientInput,
} from './types'

export async function getPatients(query: PatientQuery) {
  const response = await api.get<BaseResponse<PaginatedResponse<Patient>>>('/patients', {
    params: query,
  })
  return requireData(response.data, 'Unable to load patients.')
}

export async function getPatient(patientId: string) {
  const response = await api.get<BaseResponse<Patient>>('/patients/detail', {
    params: { patientId },
  })
  return requireData(response.data, 'Unable to load patient.')
}

export async function findPatientDuplicates(input: CreatePatientInput) {
  const response = await api.post<BaseResponse<PatientDuplicateCandidate[]>>(
    '/patients/duplicates',
    input,
  )
  return response.data.data ?? []
}

export async function createPatient(input: CreatePatientInput) {
  const response = await api.post<BaseResponse<Patient>>('/patients', input)
  return requireData(response.data, 'Unable to create patient.')
}

export async function updatePatient(input: UpdatePatientInput) {
  const response = await api.put<BaseResponse<Patient>>('/patients', input)
  return requireData(response.data, 'Unable to update patient.')
}
