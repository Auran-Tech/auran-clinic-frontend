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

export interface PatientVisitHistoryItem {
  visitId: string
  doctorId: string
  doctorName: string
  status: string
  documentationStatus: string
  entryAtUtc: string
  completedAtUtc?: string | null
  exitAtUtc?: string | null
  chiefComplaint?: string | null
  diagnosis?: string | null
  sessionCount: number
}

export interface PaginationInfo {
  totalCount: number
  rowCount: number
  currentPage: number
  totalPage: number
}

export interface PatientVisitHistory {
  patientId: string
  visits: {
    data: PatientVisitHistoryItem[]
    setting: PaginationInfo
  }
}

export interface ClinicVisitListQuery {
  page: number
  pageSize: number
  search?: string
  doctorId?: string
  status?: 'Open' | 'Completed' | 'Cancelled'
  documentationStatus?: 'NotStarted' | 'Draft' | 'Pending' | 'Completed'
  fromDate?: string
  toDate?: string
  sortBy: 'entryAtUtc' | 'patientName' | 'doctorName' | 'status'
  descending: boolean
}

export interface ClinicVisitListItem {
  visitId: string
  patientId: string
  patientNumber: string
  patientName: string
  doctorId: string
  doctorName: string
  status: string
  documentationStatus: string
  entryAtUtc: string
  completedAtUtc?: string | null
  exitAtUtc?: string | null
}

export interface ClinicVisitList {
  visits: {
    data: ClinicVisitListItem[]
    setting: PaginationInfo
  }
  summary: {
    active: number
    completed: number
    pendingDocumentation: number
  }
}
