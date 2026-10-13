import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  ClinicalFieldAdminConfiguration,
  ClinicalFieldInput,
  ClinicalFieldOptionInput,
} from './types'

const basePath = '/clinical-measurements/configuration/admin'

function requireData(
  response: BaseResponse<ClinicalFieldAdminConfiguration>,
  fallback: string,
) {
  if (!response.data) throw new Error(response.message ?? fallback)
  return response.data
}

export async function getClinicalFieldAdminConfiguration() {
  const response = await api.get<BaseResponse<ClinicalFieldAdminConfiguration>>(basePath)
  return requireData(response.data, 'Unable to load clinical field configuration.')
}

export async function createClinicalField(input: ClinicalFieldInput) {
  const response = await api.post<BaseResponse<ClinicalFieldAdminConfiguration>>(
    `${basePath}/fields`,
    {
      name: input.name,
      fieldType: input.fieldType,
      unit: input.unit,
      sortOrder: input.sortOrder,
    },
  )
  return requireData(response.data, 'Unable to create clinical field.')
}

export async function updateClinicalField(fieldId: string, input: ClinicalFieldInput) {
  const response = await api.put<BaseResponse<ClinicalFieldAdminConfiguration>>(
    `${basePath}/fields`,
    {
      fieldId,
      name: input.name,
      fieldType: input.fieldType,
      unit: input.unit,
      isEnabled: input.isEnabled ?? true,
      sortOrder: input.sortOrder,
    },
  )
  return requireData(response.data, 'Unable to update clinical field.')
}

export async function createClinicalFieldOption(
  fieldId: string,
  input: ClinicalFieldOptionInput,
) {
  const response = await api.post<BaseResponse<ClinicalFieldAdminConfiguration>>(
    `${basePath}/options`,
    { fieldId, ...input },
  )
  return requireData(response.data, 'Unable to create clinical field option.')
}

export async function updateClinicalFieldOption(
  optionId: string,
  input: ClinicalFieldOptionInput,
) {
  const response = await api.put<BaseResponse<ClinicalFieldAdminConfiguration>>(
    `${basePath}/options`,
    { optionId, ...input },
  )
  return requireData(response.data, 'Unable to update clinical field option.')
}

export async function deleteClinicalFieldOption(optionId: string) {
  const response = await api.delete<BaseResponse<ClinicalFieldAdminConfiguration>>(
    `${basePath}/options`,
    { data: { optionId } },
  )
  return requireData(response.data, 'Unable to delete clinical field option.')
}
