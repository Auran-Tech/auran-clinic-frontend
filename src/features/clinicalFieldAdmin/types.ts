export interface ClinicalFieldAdminOption {
  id: string
  label: string
  value: string
  sortOrder: number
}

export interface ClinicalFieldAdminField {
  id: string
  name: string
  fieldType: string
  unit?: string | null
  isEnabled: boolean
  sortOrder: number
  hasMeasurements: boolean
  options: ClinicalFieldAdminOption[]
}

export interface ClinicalFieldAdminConfiguration {
  fields: ClinicalFieldAdminField[]
}

export interface ClinicalFieldInput {
  name: string
  fieldType: string
  unit?: string
  isEnabled?: boolean
  sortOrder: number
}

export interface ClinicalFieldOptionInput {
  label: string
  value: string
  sortOrder: number
}
