import { api } from '../../lib/api'
import type { BaseResponse, PaginatedResponse } from '../../types/api'
import type {
  CreatePatientInput,
  Patient,
  PatientDuplicateCandidate,
  PatientQuery,
} from './types'

export async function getPatients(query: PatientQuery) {
  const response = await api.get<BaseResponse<PaginatedResponse<Patient>>>('/patients', {
    params: query,
  })
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to load patients.')
  }
  return response.data.data
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
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to create patient.')
  }
  return response.data.data
}
