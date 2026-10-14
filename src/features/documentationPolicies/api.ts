import { isAxiosError } from 'axios'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'

export const DOCUMENTATION_FIELDS = [
  { key: 'ChiefComplaint', label: 'Chief complaint' },
  { key: 'Examination', label: 'Examination' },
  { key: 'Diagnosis', label: 'Diagnosis' },
  { key: 'Notes', label: 'Clinical notes' },
  { key: 'TreatmentPlan', label: 'Treatment plan' },
] as const

export interface SpecialtyDocumentationPolicy {
  specialtyCode: string
  requiredFields: string[]
  version: number
}

export async function getSpecialtyDocumentationPolicy(code: string) {
  try {
    const response = await api.get<BaseResponse<SpecialtyDocumentationPolicy>>(
      '/documentation-policies', { params: { specialtyCode: code } },
    )
    return response.data.data ?? null
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export async function saveSpecialtyDocumentationPolicy(input: {
  specialtyCode: string
  requiredFields: string[]
}) {
  const response = await api.put<BaseResponse<SpecialtyDocumentationPolicy>>(
    '/documentation-policies', input,
  )
  if (!response.data.data) throw new Error('Unable to save documentation policy.')
  return response.data.data
}

export async function assignDoctorDocumentationSpecialty(input: {
  doctorId: string
  specialtyCode: string
}) {
  await api.put('/documentation-policies/doctors', input)
}
