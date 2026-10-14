import { describe, expect, it } from 'vitest'
import { duplicateReviewKey } from './duplicateReview'

describe('patient duplicate review ownership', () => {
  const patient = {
    fullName: 'Jane Example',
    phone: '0123456789',
    dateOfBirth: '2000-01-02',
    gender: 'Female',
    notes: 'Initial',
  }

  it('ignores harmless surrounding whitespace in normalized identity fields', () => {
    expect(duplicateReviewKey(patient)).toBe(
      duplicateReviewKey({ ...patient, fullName: ' Jane Example ', phone: ' 0123456789 ' }),
    )
  })

  it('invalidates review if phone, birthdate, name or any submitted details change', () => {
    const reviewedKey = duplicateReviewKey(patient)
    for (const updated of [
      { phone: '0999999999' },
      { fullName: 'Another Name' },
      { dateOfBirth: '1998-02-03' },
      { gender: 'Male' },
      { notes: 'Updated after review' },
    ]) {
      expect(duplicateReviewKey({ ...patient, ...updated })).not.toBe(reviewedKey)
    }
  })
})
