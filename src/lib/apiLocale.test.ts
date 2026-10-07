import { describe, expect, it } from 'vitest'

function normalizeApiLanguage(language: string | null) {
  return language === 'ar' ? 'ar' : 'en'
}

describe('API language propagation', () => {
  it('normalizes unsupported values to English', () => {
    expect(normalizeApiLanguage('fr')).toBe('en')
  })

  it('preserves Arabic', () => {
    expect(normalizeApiLanguage('ar')).toBe('ar')
  })
})
