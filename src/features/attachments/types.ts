export interface PatientAttachment {
  attachmentId: string
  fileId: string
  patientId: string
  originalName: string
  contentType: string
  size: number
  category?: string | null
  notes?: string | null
  uploadedAtUtc: string
}
