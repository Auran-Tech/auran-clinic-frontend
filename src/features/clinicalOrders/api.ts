import axios from 'axios'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  ClinicalOrder,
  ClinicalOrderSectionDefinition,
  SaveClinicalOrderInput,
} from './types'

export async function getClinicalOrderDefinitions() {
  const response = await api.get<BaseResponse<ClinicalOrderSectionDefinition[]>>(
    '/clinical-orders/definitions',
  )
  return response.data.data ?? []
}

export async function getClinicalOrder(visitId: string) {
  try {
    const response = await api.get<BaseResponse<ClinicalOrder>>('/clinical-orders', {
      params: { visitId },
    })
    return response.data.data ?? null
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function saveClinicalOrder(input: SaveClinicalOrderInput) {
  const response = await api.put<BaseResponse<ClinicalOrder>>('/clinical-orders', input)
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to save clinical order.')
  }
  return response.data.data
}
