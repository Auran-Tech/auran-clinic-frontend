export interface ClinicalOrderSectionAdmin {
  id: string
  name: string
  sectionType: string
  sortOrder: number
  isEnabled: boolean
  hasData: boolean
}

export interface ClinicalOrderSectionAdminConfiguration {
  sections: ClinicalOrderSectionAdmin[]
}

export interface ClinicalOrderSectionInput {
  name: string
  sectionType: string
  sortOrder: number
  isEnabled?: boolean
}
