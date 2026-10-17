export interface DoctorActivityQuery {
  fromDate?: string
  toDate?: string
  doctorId?: string
}

export interface DoctorActivityRow {
  doctorId: string
  doctorName: string
  currentQueue: number
  totalVisits: number
  completedDocs: number
  pendingDocs: number
}

export interface DoctorActivityReport {
  fromDate: string | null
  toDate: string | null
  totalCount: number
  rows: DoctorActivityRow[]
}
