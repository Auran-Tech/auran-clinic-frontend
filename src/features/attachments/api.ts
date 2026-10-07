import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { PatientAttachment } from './types'

export async function getPatientAttachments(patientId: string) {
  const response = await api.get<BaseResponse<PatientAttachment[]>>('/patient-attachments', {
    params: { patientId },
  })
  return response.data.data ?? []
}

export async function uploadPatientAttachment(input: {
  patientId: string
  file: File
  category?: string
  notes?: string
}) {
  const form = new FormData()
  form.append('patientId', input.patientId)
  form.append('file', input.file)
  if (input.category) form.append('category', input.category)
  if (input.notes) form.append('notes', input.notes)

  const response = await api.post<BaseResponse<PatientAttachment>>(
    '/patient-attachments',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )

  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to upload attachment.')
  }

  return response.data.data
}

export async function downloadPatientAttachment(fileId: string, originalName: string) {
  const response = await api.get<Blob>('/patient-attachments/download', {
    params: { fileId },
    responseType: 'blob',
  })

  const url = URL.createObjectURL(response.data)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = originalName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function deletePatientAttachment(attachmentId: string) {
  await api.delete('/patient-attachments', {
    data: { attachmentId },
  })
}
