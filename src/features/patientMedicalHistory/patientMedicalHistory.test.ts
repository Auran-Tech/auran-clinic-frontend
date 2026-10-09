import { describe, expect, it } from 'vitest'

function normalizeOptional(value: string) {
  return value.trim() || undefined
}

describe('patient medical history inputs', () => {
  it('normalizes blank optional values', () => {
    expect(normalizeOptional('   ')).toBeUndefined()
  })

  it('preserves meaningful optional values', () => {
    expect(normalizeOptional('Rash')).toBe('Rash')
  })
})
