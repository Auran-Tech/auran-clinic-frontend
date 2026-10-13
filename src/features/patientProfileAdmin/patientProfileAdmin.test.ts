import { describe, expect, it } from 'vitest'

function canChangeFieldType(hasValues: boolean) {
  return !hasValues
}

function canDeleteOption(fieldHasValues: boolean) {
  return !fieldHasValues
}

describe('patient profile configuration protections', () => {
  it('locks field type after patient values exist', () => {
    expect(canChangeFieldType(true)).toBe(false)
    expect(canChangeFieldType(false)).toBe(true)
  })

  it('locks option deletion after patient values exist', () => {
    expect(canDeleteOption(true)).toBe(false)
    expect(canDeleteOption(false)).toBe(true)
  })
})
