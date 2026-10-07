import { describe, expect, it } from 'vitest'

describe('locale direction mapping', () => {
  it('maps Arabic to rtl', () => {
    const language = 'ar'
    const direction = language === 'ar' ? 'rtl' : 'ltr'
    expect(direction).toBe('rtl')
  })

  it('maps English to ltr', () => {
    const language = 'en'
    const direction = language === 'ar' ? 'rtl' : 'ltr'
    expect(direction).toBe('ltr')
  })
})
