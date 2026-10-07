export type FollowUpBucket = 'All' | 'Today' | 'Upcoming' | 'Overdue' | 'Completed'

export interface FollowUp {
  id: string
  patientId: string
  patientNumber: string
  patientName: string
  visitId: string
  doctorId: string
  doctorName: string
  recommendation: string
  recommendedAfterDays?: number | null
  recommendedDate?: string | null
  status: string
  bucket: FollowUpBucket | string
}

export interface CreateFollowUpInput {
  visitId: string
  recommendation: string
  recommendedAfterDays?: number
  recommendedDate?: string
}
