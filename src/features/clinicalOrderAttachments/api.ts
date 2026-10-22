import { requireData } from '../../lib/requireData'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { ClinicalOrderAttachmentWorkspace } from './types'

export async function getClinicalOrderAttachmentWorkspace(visitId: string) {
  const response = await api.get<BaseResponse<ClinicalOrderAttachmentWorkspace>>(
    '/clinical-order-attachments',
    { params: { visitId } },
  )
  return requireData(response.data, 'Unable to load clinical order attachments.')
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
  return requireData(response.data, 'Unable to link clinical order attachment.')
}

export async function unlinkClinicalOrderAttachment(linkId: string) {
  const response = await api.delete<BaseResponse<ClinicalOrderAttachmentWorkspace>>(
    '/clinical-order-attachments',
    { data: { linkId } },
  )
  return requireData(response.data, 'Unable to unlink clinical order attachment.')
}
