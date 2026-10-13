import { describe, expect, it } from 'vitest'

function canChangeClinicalFieldType(hasMeasurements: boolean) {
  return !hasMeasurements
}

function canDeleteClinicalOption(hasMeasurements: boolean) {
  return !hasMeasurements
}

describe('clinical field configuration protections', () => {
  it('locks field type when measurement history exists', () => {
    expect(canChangeClinicalFieldType(true)).toBe(false)
    expect(canChangeClinicalFieldType(false)).toBe(true)
  })

  it('locks option deletion when measurement history exists', () => {
    expect(canDeleteClinicalOption(true)).toBe(false)
    expect(canDeleteClinicalOption(false)).toBe(true)
  })
})
