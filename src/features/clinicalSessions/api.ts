import axios from 'axios'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { ClinicalDocumentationInput, ClinicalSession } from './types'

export async function getActiveClinicalSession(visitId: string) {
  try {
    const response = await api.get<BaseResponse<ClinicalSession>>('/clinical-sessions/active', {
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

export async function startClinicalSession(visitId: string) {
  const response = await api.post<BaseResponse<ClinicalSession>>('/clinical-sessions/start', {
    visitId,
  })
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to start clinical session.')
  }
  return response.data.data
}

export async function saveClinicalDocumentation(input: ClinicalDocumentationInput) {
  const response = await api.put<BaseResponse<ClinicalSession>>(
    '/clinical-sessions/documentation',
    input,
  )
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to save clinical documentation.')
  }
  return response.data.data
}

export async function endClinicalSession(visitId: string) {
  const response = await api.put<BaseResponse<ClinicalSession>>('/clinical-sessions/end', {
    visitId,
  })
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to end clinical session.')
  }
  return response.data.data
}
