import { describe, expect, it } from 'vitest'

function directionForLanguage(language: string) {
  return language === 'ar' ? 'rtl' : 'ltr'
}

describe('locale direction mapping', () => {
  it('maps Arabic to rtl', () => {
    expect(directionForLanguage('ar')).toBe('rtl')
  })

  it('maps English to ltr', () => {
    expect(directionForLanguage('en')).toBe('ltr')
  })
})
