export interface DashboardSummary {
  localDate: string
  totalPatients: number
  visitsToday: number
  activeQueue: number
  completedVisitsToday: number
  pendingDocumentation: number
  followUpsToday: number
  overdueFollowUps: number
}

export interface VisitReportRow {
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
  diagnosis?: string | null
  treatmentPlan?: string | null
}

export interface VisitReport {
  fromDate?: string | null
  toDate?: string | null
  totalCount: number
  rows: VisitReportRow[]
}

export interface VisitReportQuery {
  fromDate?: string
  toDate?: string
  doctorId?: string
  visitStatus?: string
  documentationStatus?: string
}
