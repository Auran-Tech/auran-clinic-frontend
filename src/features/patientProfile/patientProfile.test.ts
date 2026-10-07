import { describe, expect, it } from 'vitest'

describe('dynamic patient profile serialization', () => {
  it('serializes multi-select values as JSON', () => {
    const selected = ['A', 'B']
    expect(JSON.stringify(selected)).toBe('["A","B"]')
  })

  it('preserves false as a meaningful boolean value', () => {
    const raw = 'false'
    const value = raw === '' ? undefined : raw === 'true'
    expect(value).toBe(false)
  })

  it('treats empty optional text as undefined', () => {
    const raw = '   '
    const value = raw.trim() || undefined
    expect(value).toBeUndefined()
  })
})
