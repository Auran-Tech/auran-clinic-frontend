export interface ClinicalOrderSectionDefinition {
  id: string
  name: string
  sectionType: 'Text' | 'Structured' | string
  sortOrder: number
}

export interface ClinicalOrderItem {
  id: string
  name: string
  detailsJson?: string | null
}

export interface ClinicalOrderSection {
  id: string
  sectionDefinitionId: string
  sectionName: string
  sectionType: string
  sortOrder: number
  textValue?: string | null
  items: ClinicalOrderItem[]
}

export interface ClinicalOrder {
  id: string
  visitId: string
  patientId: string
  doctorId: string
  sections: ClinicalOrderSection[]
}

export interface SaveClinicalOrderInput {
  visitId: string
  sections: {
    sectionDefinitionId: string
    textValue?: string
    items: {
      name: string
      detailsJson?: string
    }[]
  }[]
}
