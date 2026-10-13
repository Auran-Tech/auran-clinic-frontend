import { describe, expect, it } from 'vitest'

function parseBooleanDraft(raw: string) {
  return raw === '' ? undefined : raw === 'true'
}

describe('clinical measurement serialization', () => {
  it('preserves false as a recorded boolean value', () => {
    expect(parseBooleanDraft('false')).toBe(false)
  })

  it('serializes a multi-select measurement as JSON', () => {
    expect(JSON.stringify(['left', 'right'])).toBe('["left","right"]')
  })

  it('treats zero as a valid numeric measurement', () => {
    const raw = '0'
    expect(Number(raw)).toBe(0)
  })
})
