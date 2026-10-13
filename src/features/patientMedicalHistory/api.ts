import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { PatientMedicalHistory } from './types'

const basePath = '/patient-medical-history'

function requireData(
  response: BaseResponse<PatientMedicalHistory>,
  fallback: string,
) {
  if (!response.data) throw new Error(response.message ?? fallback)
  return response.data
}

export async function getPatientMedicalHistory(patientId: string) {
  const response = await api.get<BaseResponse<PatientMedicalHistory>>(basePath, {
    params: { patientId },
  })
  return requireData(response.data, 'Unable to load patient medical history.')
}

export async function addPatientCondition(input: {
  patientId: string
  name: string
  notes?: string
}) {
  const response = await api.post<BaseResponse<PatientMedicalHistory>>(
    `${basePath}/conditions`,
    input,
  )
  return requireData(response.data, 'Unable to add patient condition.')
}

export async function deletePatientCondition(itemId: string) {
  const response = await api.delete<BaseResponse<PatientMedicalHistory>>(
    `${basePath}/conditions`,
    { data: { itemId } },
  )
  return requireData(response.data, 'Unable to remove patient condition.')
}

export async function addPatientAllergy(input: {
  patientId: string
  name: string
  reaction?: string
  notes?: string
}) {
  const response = await api.post<BaseResponse<PatientMedicalHistory>>(
    `${basePath}/allergies`,
    input,
  )
  return requireData(response.data, 'Unable to add patient allergy.')
}

export async function deletePatientAllergy(itemId: string) {
  const response = await api.delete<BaseResponse<PatientMedicalHistory>>(
    `${basePath}/allergies`,
    { data: { itemId } },
  )
  return requireData(response.data, 'Unable to remove patient allergy.')
}

export async function addPatientMedication(input: {
  patientId: string
  name: string
  dosage?: string
  notes?: string
}) {
  const response = await api.post<BaseResponse<PatientMedicalHistory>>(
    `${basePath}/medications`,
    input,
  )
  return requireData(response.data, 'Unable to add patient medication.')
}

export async function deletePatientMedication(itemId: string) {
  const response = await api.delete<BaseResponse<PatientMedicalHistory>>(
    `${basePath}/medications`,
    { data: { itemId } },
  )
  return requireData(response.data, 'Unable to remove patient medication.')
}
