export interface PatientReportQuery {
  fromDate?: string
  toDate?: string
  gender?: string
}

export interface PatientReportRow {
  patientId: string
  patientNumber: string
  patientName: string
  phone: string
  gender: string | null
  dateOfBirth: string | null
  createdAtUtc: string
}

export interface PatientReport {
  fromDate: string | null
  toDate: string | null
  totalCount: number
  rows: PatientReportRow[]
}
