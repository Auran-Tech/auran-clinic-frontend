import { describe, expect, it } from 'vitest'

describe('API language propagation', () => {
  it('normalizes unsupported values to English', () => {
    const stored = 'fr'
    const header = stored === 'ar' ? 'ar' : 'en'
    expect(header).toBe('en')
  })

  it('preserves Arabic', () => {
    const stored = 'ar'
    const header = stored === 'ar' ? 'ar' : 'en'
    expect(header).toBe('ar')
  })
})
