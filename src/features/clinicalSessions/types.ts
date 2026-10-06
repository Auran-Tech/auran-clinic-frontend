export interface ClinicalSession {
  sessionId: string
  visitId: string
  doctorId: string
  startedAtUtc: string
  endedAtUtc?: string | null
  documentationStatus: string
  chiefComplaint?: string | null
  examination?: string | null
  diagnosis?: string | null
  notes?: string | null
  treatmentPlan?: string | null
}

export interface ClinicalDocumentationInput {
  visitId: string
  chiefComplaint?: string
  examination?: string
  diagnosis?: string
  notes?: string
  treatmentPlan?: string
}
