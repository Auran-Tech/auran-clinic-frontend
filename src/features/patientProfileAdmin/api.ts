import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  PatientProfileAdminConfiguration,
  PatientProfileFieldInput,
  PatientProfileOptionInput,
  PatientProfileSectionInput,
} from './types'

const basePath = '/patient-profile/configuration/admin'

function requireData(
  response: BaseResponse<PatientProfileAdminConfiguration>,
  fallback: string,
) {
  if (!response.data) throw new Error(response.message ?? fallback)
  return response.data
}

export async function getPatientProfileAdminConfiguration() {
  const response = await api.get<BaseResponse<PatientProfileAdminConfiguration>>(basePath)
  return requireData(response.data, 'Unable to load patient profile configuration.')
}

export async function createPatientProfileSection(input: PatientProfileSectionInput) {
  const response = await api.post<BaseResponse<PatientProfileAdminConfiguration>>(
    `${basePath}/sections`,
    { name: input.name, sortOrder: input.sortOrder },
  )
  return requireData(response.data, 'Unable to create patient profile section.')
}

export async function updatePatientProfileSection(
  sectionId: string,
  input: PatientProfileSectionInput,
) {
  const response = await api.put<BaseResponse<PatientProfileAdminConfiguration>>(
    `${basePath}/sections`,
    {
      sectionId,
      name: input.name,
      sortOrder: input.sortOrder,
      isEnabled: input.isEnabled ?? true,
    },
  )
  return requireData(response.data, 'Unable to update patient profile section.')
}

export async function createPatientProfileField(input: PatientProfileFieldInput) {
  const response = await api.post<BaseResponse<PatientProfileAdminConfiguration>>(
    `${basePath}/fields`,
    {
      sectionId: input.sectionId,
      label: input.label,
      fieldType: input.fieldType,
      isRequired: input.isRequired,
      sortOrder: input.sortOrder,
    },
  )
  return requireData(response.data, 'Unable to create patient profile field.')
}

export async function updatePatientProfileField(
  fieldId: string,
  input: PatientProfileFieldInput,
) {
  const response = await api.put<BaseResponse<PatientProfileAdminConfiguration>>(
    `${basePath}/fields`,
    {
      fieldId,
      ...input,
      isEnabled: input.isEnabled ?? true,
    },
  )
  return requireData(response.data, 'Unable to update patient profile field.')
}

export async function createPatientProfileOption(
  fieldId: string,
  input: PatientProfileOptionInput,
) {
  const response = await api.post<BaseResponse<PatientProfileAdminConfiguration>>(
    `${basePath}/options`,
    { fieldId, label: input.label, value: input.value, sortOrder: input.sortOrder },
  )
  return requireData(response.data, 'Unable to create patient profile option.')
}

export async function updatePatientProfileOption(
  optionId: string,
  input: PatientProfileOptionInput,
) {
  const response = await api.put<BaseResponse<PatientProfileAdminConfiguration>>(
    `${basePath}/options`,
    { optionId, label: input.label, value: input.value, sortOrder: input.sortOrder },
  )
  return requireData(response.data, 'Unable to update patient profile option.')
}

export async function deletePatientProfileOption(optionId: string) {
  const response = await api.delete<BaseResponse<PatientProfileAdminConfiguration>>(
    `${basePath}/options`,
    { data: { optionId } },
  )
  return requireData(response.data, 'Unable to delete patient profile option.')
}
