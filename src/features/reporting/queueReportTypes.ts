export interface QueueReportQuery {
  fromDate?: string
  toDate?: string
  doctorId?: string
  workflowStatusId?: string
}
export interface QueueReportRow {
  queueEntryId: string
  patientId: string
  patientNumber: string
  patientName: string
  doctorId: string | null
  doctorName: string | null
  workflowStatusId: string
  workflowStatusCode: string
  workflowStatusName: string
  entryAtUtc: string
  exitAtUtc: string | null
  durationMinutes: number | null
}
export interface QueueReport {
  fromDate: string | null
  toDate: string | null
  totalCount: number
  rows: QueueReportRow[]
}
