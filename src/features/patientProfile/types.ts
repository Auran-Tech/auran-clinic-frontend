export interface PatientProfileFieldOption {
  id: string
  label: string
  value: string
  sortOrder: number
}

export interface PatientProfileField {
  id: string
  label: string
  fieldType: string
  isRequired: boolean
  sortOrder: number
  options: PatientProfileFieldOption[]
}

export interface PatientProfileSection {
  id: string
  name: string
  sortOrder: number
  isSystem: boolean
  fields: PatientProfileField[]
}

export interface PatientProfileConfiguration {
  sections: PatientProfileSection[]
}

export interface PatientProfileValue {
  fieldId: string
  textValue?: string | null
  numberValue?: number | null
  booleanValue?: boolean | null
  dateValue?: string | null
  fileId?: string | null
  jsonValue?: string | null
}

export interface PatientProfile {
  patientId: string
  values: PatientProfileValue[]
}

export interface SavePatientProfileValue {
  fieldId: string
  textValue?: string
  numberValue?: number
  booleanValue?: boolean
  dateValue?: string
  jsonValue?: string
}

export interface SavePatientProfileInput {
  patientId: string
  values: SavePatientProfileValue[]
}
