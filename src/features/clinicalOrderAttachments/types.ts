export interface ClinicalOrderAttachmentSection {
  sectionDefinitionId: string
  name: string
  sectionType: 'Image' | 'File' | string
  sortOrder: number
}

export interface ClinicalOrderAttachmentFile {
  attachmentId: string
  fileId: string
  originalName: string
  contentType: string
  size: number
  category?: string | null
  notes?: string | null
  uploadedAtUtc: string
}

export interface ClinicalOrderAttachmentLink {
  linkId: string
  fileId: string
  sectionDefinitionId: string
  sectionName: string
  sectionType: string
  originalName: string
  contentType: string
  size: number
}

export interface ClinicalOrderAttachmentWorkspace {
  visitId: string
  patientId: string
  clinicalOrderId?: string | null
  sections: ClinicalOrderAttachmentSection[]
  files: ClinicalOrderAttachmentFile[]
  links: ClinicalOrderAttachmentLink[]
}
