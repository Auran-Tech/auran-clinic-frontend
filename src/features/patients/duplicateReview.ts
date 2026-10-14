import type { CreatePatientInput } from './types'

/** Only identity fields influence duplicate matching; keep the comparison stable. */
export function duplicateReviewKey(input: CreatePatientInput): string {
  return JSON.stringify([
    input.fullName.trim(),
    input.phone.trim(),
    input.dateOfBirth ?? '',
    input.gender ?? '',
    input.notes ?? '',
  ])
}
