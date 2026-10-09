import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  ClinicalOrderSectionAdminConfiguration,
  ClinicalOrderSectionInput,
} from './types'

const basePath = '/clinical-orders/configuration/admin'

function requireData(
  response: BaseResponse<ClinicalOrderSectionAdminConfiguration>,
  fallback: string,
) {
  if (!response.data) throw new Error(response.message ?? fallback)
  return response.data
}

export async function getClinicalOrderSectionAdminConfiguration() {
  const response = await api.get<BaseResponse<ClinicalOrderSectionAdminConfiguration>>(basePath)
  return requireData(response.data, 'Unable to load clinical order section configuration.')
}

export async function createClinicalOrderSection(input: ClinicalOrderSectionInput) {
  const response = await api.post<BaseResponse<ClinicalOrderSectionAdminConfiguration>>(
    basePath,
    {
      name: input.name,
      sectionType: input.sectionType,
      sortOrder: input.sortOrder,
    },
  )
  return requireData(response.data, 'Unable to create clinical order section.')
}

export async function updateClinicalOrderSection(
  sectionDefinitionId: string,
  input: ClinicalOrderSectionInput,
) {
  const response = await api.put<BaseResponse<ClinicalOrderSectionAdminConfiguration>>(
    basePath,
    {
      sectionDefinitionId,
      name: input.name,
      sectionType: input.sectionType,
      sortOrder: input.sortOrder,
      isEnabled: input.isEnabled ?? true,
    },
  )
  return requireData(response.data, 'Unable to update clinical order section.')
}
