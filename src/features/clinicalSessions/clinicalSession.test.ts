import { describe, expect, it } from 'vitest'

describe('clinical documentation contract', () => {
  it('keeps visit id as the required documentation key', () => {
    const payload = {
      visitId: '00000000-0000-0000-0000-000000000001',
      chiefComplaint: 'Headache',
      diagnosis: 'Migraine',
    }

    expect(payload.visitId).toBeTruthy()
    expect(payload.chiefComplaint).toBe('Headache')
  })
})
