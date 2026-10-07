export interface PendingDocumentation {
  visitId: string
  patientId: string
  patientNumber: string
  patientName: string
  doctorId: string
  doctorName: string
  visitStatus: string
  documentationStatus: string
  entryAtUtc: string
  completedAtUtc?: string | null
  exitAtUtc?: string | null
  chiefComplaint?: string | null
  examination?: string | null
  diagnosis?: string | null
  notes?: string | null
  treatmentPlan?: string | null
}

export interface CompletePendingDocumentationInput {
  visitId: string
  chiefComplaint?: string
  examination?: string
  diagnosis?: string
  notes?: string
  treatmentPlan?: string
}
