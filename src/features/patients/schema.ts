import { z } from 'zod'

export const patientSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required.').max(256),
  phone: z.string().trim().min(6, 'Phone is required.').max(64),
  gender: z.string().trim().max(32).optional(),
  dateOfBirth: z.string().optional(),
  notes: z.string().trim().max(4000).optional(),
})

export type PatientFormValues = z.infer<typeof patientSchema>
