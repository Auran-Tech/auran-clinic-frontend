import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { ClinicalOrderAttachmentWorkspace } from './types'

export async function getClinicalOrderAttachmentWorkspace(visitId: string) {
  const response = await api.get<BaseResponse<ClinicalOrderAttachmentWorkspace>>(
    '/clinical-order-attachments',
    { params: { visitId } },
  )
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to load clinical order attachments.')
  }
  return response.data.data
}

export async function linkClinicalOrderAttachment(input: {
  visitId: string
  fileId: string
  sectionDefinitionId: string
}) {
  const response = await api.post<BaseResponse<ClinicalOrderAttachmentWorkspace>>(
    '/clinical-order-attachments',
    input,
  )
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to link clinical order attachment.')
  }
  return response.data.data
}

export async function unlinkClinicalOrderAttachment(linkId: string) {
  const response = await api.delete<BaseResponse<ClinicalOrderAttachmentWorkspace>>(
    '/clinical-order-attachments',
    { data: { linkId } },
  )
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to unlink clinical order attachment.')
  }
  return response.data.data
}
