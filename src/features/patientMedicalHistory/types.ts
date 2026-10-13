export interface PatientCondition {
  id: string
  name: string
  notes?: string | null
  recordedAtUtc: string
  recordedByUserId: string
}

export interface PatientAllergy {
  id: string
  name: string
  reaction?: string | null
  notes?: string | null
  recordedAtUtc: string
  recordedByUserId: string
}

export interface PatientMedication {
  id: string
  name: string
  dosage?: string | null
  notes?: string | null
  recordedAtUtc: string
  recordedByUserId: string
}

export interface PatientMedicalHistory {
  patientId: string
  conditions: PatientCondition[]
  allergies: PatientAllergy[]
  medications: PatientMedication[]
}
