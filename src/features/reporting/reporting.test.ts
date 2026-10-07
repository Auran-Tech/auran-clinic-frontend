import { describe, expect, it } from 'vitest'

describe('visit report filters', () => {
  it('allows an open-ended date range', () => {
    const query = {
      fromDate: '2026-10-01',
      toDate: undefined,
    }

    expect(query.fromDate).toBe('2026-10-01')
    expect(query.toDate).toBeUndefined()
  })

  it('clears optional filters cleanly', () => {
    const query = {
      doctorId: undefined,
      visitStatus: undefined,
      documentationStatus: undefined,
    }

    expect(Object.values(query).every((value) => value === undefined)).toBe(true)
  })
})
