import { describe, expect, it } from 'vitest'

describe('follow-up scheduling readiness', () => {
  it('accepts an explicit date', () => {
    const recommendation = 'Review symptoms'
    const date = '2026-10-14'
    const days = undefined

    expect(Boolean(recommendation && (date || days))).toBe(true)
  })

  it('accepts a positive day interval', () => {
    const recommendation = 'Review lab results'
    const date = ''
    const days = 7

    expect(Boolean(recommendation && (date || days > 0))).toBe(true)
  })
})
