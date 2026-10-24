import { describe, expect, it } from 'vitest'
import { formatSessionDate } from './sessionDisplay'

describe('formatSessionDate', () => {
  it('does not show the unset database date or invalid values', () => {
    expect(formatSessionDate('0001-01-01T00:00:00Z', 'en-US')).toBeNull()
    expect(formatSessionDate('invalid', 'en-US')).toBeNull()
  })

  it('formats a real UTC session timestamp for the selected language', () => {
    const english = formatSessionDate('2026-10-24T10:30:00Z', 'en-US')
    const arabic = formatSessionDate('2026-10-24T10:30:00Z', 'ar-EG')

    expect(english).toContain('2026')
    expect(arabic).not.toBeNull()
    expect(english).not.toBe(arabic)
  })
})
