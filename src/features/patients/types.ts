export interface Patient {
  id: string
  patientNumber: string
  fullName: string
  phone: string
  gender?: string | null
  dateOfBirth?: string | null
  notes?: string | null
  createdDate: string
  updatedDate?: string | null
}

export interface PatientDuplicateCandidate {
  id: string
  patientNumber: string
  fullName: string
  phone: string
  dateOfBirth?: string | null
  matchReason: 'phone' | 'name_and_date_of_birth' | string
}

export interface CreatePatientInput {
  fullName: string
  phone: string
  gender?: string
  dateOfBirth?: string
  notes?: string
}

export interface PatientQuery {
  search?: string
  page?: number
  pageSize?: number
}

export interface UpdatePatientInput extends CreatePatientInput {
  patientId: string
}
