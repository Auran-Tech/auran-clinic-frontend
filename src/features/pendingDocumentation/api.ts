import { requireData } from '../../lib/requireData'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  CompletePendingDocumentationInput,
  PendingDocumentation,
} from './types'

export async function getPendingDocumentation(mineOnly = true) {
  const response = await api.get<BaseResponse<PendingDocumentation[]>>(
    '/pending-documentation',
    { params: { mineOnly } },
  )
  return response.data.data ?? []
}

export async function completePendingDocumentation(
  input: CompletePendingDocumentationInput,
) {
  const response = await api.put<BaseResponse<PendingDocumentation>>(
    '/pending-documentation/complete',
    input,
  )

  return requireData(response.data, 'Unable to complete documentation.')
}
