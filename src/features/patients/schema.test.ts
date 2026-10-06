import { describe, expect, it } from 'vitest'
import { patientSchema } from './schema'

describe('patientSchema', () => {
  it('accepts the minimum valid patient registration data', () => {
    const result = patientSchema.safeParse({
      fullName: 'Ahmed Ali',
      phone: '+201001234567',
      gender: '',
      dateOfBirth: '',
      notes: '',
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing required patient data', () => {
    const result = patientSchema.safeParse({
      fullName: '',
      phone: '',
    })

    expect(result.success).toBe(false)
  })

  it('rejects values beyond backend-compatible lengths', () => {
    const result = patientSchema.safeParse({
      fullName: 'A'.repeat(257),
      phone: '+201001234567',
    })

    expect(result.success).toBe(false)
  })
})
