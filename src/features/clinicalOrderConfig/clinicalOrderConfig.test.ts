import { describe, expect, it } from 'vitest'

function canChangeSectionType(hasData: boolean) {
  return !hasData
}

describe('clinical order section protections', () => {
  it('locks section type after order data exists', () => {
    expect(canChangeSectionType(true)).toBe(false)
    expect(canChangeSectionType(false)).toBe(true)
  })
})
