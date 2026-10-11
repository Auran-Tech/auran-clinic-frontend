export interface Visit {
  id: string
  patientId: string
  doctorId: string
  status: string
  entryAtUtc: string
  queueEntryId: string
  workflowStatusId: string
  workflowStatusCode: string
  workflowStatusName: string
}

export interface StartVisitInput {
  patientId: string
  doctorId: string
}
