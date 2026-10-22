import { requireData } from '../../lib/requireData'
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
  return requireData(response.data, 'Unable to start clinical session.')
}

export async function saveClinicalDocumentation(input: ClinicalDocumentationInput) {
  const response = await api.put<BaseResponse<ClinicalSession>>(
    '/clinical-sessions/documentation',
    input,
  )
  return requireData(response.data, 'Unable to save clinical documentation.')
}

export async function endClinicalSession(visitId: string) {
  const response = await api.put<BaseResponse<ClinicalSession>>('/clinical-sessions/end', {
    visitId,
  })
  return requireData(response.data, 'Unable to end clinical session.')
}
