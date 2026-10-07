export interface ClinicalMeasurementFieldOption {
  id: string
  label: string
  value: string
  sortOrder: number
}

export interface ClinicalMeasurementField {
  id: string
  name: string
  fieldType: string
  unit?: string | null
  sortOrder: number
  options: ClinicalMeasurementFieldOption[]
}

export interface ClinicalMeasurement {
  id: string
  patientId: string
  visitId?: string | null
  clinicalFieldId: string
  fieldName: string
  fieldType: string
  unit?: string | null
  textValue?: string | null
  numberValue?: number | null
  booleanValue?: boolean | null
  dateValue?: string | null
  jsonValue?: string | null
  recordedAtUtc: string
  recordedByUserId: string
}

export interface RecordClinicalMeasurementValue {
  fieldId: string
  textValue?: string
  numberValue?: number
  booleanValue?: boolean
  dateValue?: string
  jsonValue?: string
}
