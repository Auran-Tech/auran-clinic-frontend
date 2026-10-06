export interface QueueEntry {
  queueEntryId: string
  visitId: string
  patientId: string
  patientNumber: string
  patientName: string
  doctorId?: string | null
  doctorName?: string | null
  workflowStatusId: string
  workflowStatusCode: string
  workflowStatusName: string
  workflowStatusColor: string
  entryAtUtc: string
  exitAtUtc?: string | null
}

export interface QueueTransitionOption {
  workflowStatusId: string
  code: string
  name: string
  color: string
  isSystemFinal: boolean
}
