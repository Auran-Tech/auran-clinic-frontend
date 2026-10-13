export interface PatientProfileAdminOption {
  id: string
  label: string
  value: string
  sortOrder: number
}

export interface PatientProfileAdminField {
  id: string
  sectionId: string
  label: string
  fieldType: string
  isRequired: boolean
  isEnabled: boolean
  sortOrder: number
  hasValues: boolean
  options: PatientProfileAdminOption[]
}

export interface PatientProfileAdminSection {
  id: string
  name: string
  sortOrder: number
  isSystem: boolean
  isEnabled: boolean
  fields: PatientProfileAdminField[]
}

export interface PatientProfileAdminConfiguration {
  sections: PatientProfileAdminSection[]
}

export interface PatientProfileSectionInput {
  name: string
  sortOrder: number
  isEnabled?: boolean
}

export interface PatientProfileFieldInput {
  sectionId: string
  label: string
  fieldType: string
  isRequired: boolean
  isEnabled?: boolean
  sortOrder: number
}

export interface PatientProfileOptionInput {
  fieldId?: string
  label: string
  value: string
  sortOrder: number
}
