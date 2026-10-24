// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getLanguagePreference,
  getThemePreference,
  setLanguagePreference,
  setThemePreference,
} from './preferences'

describe('browser preferences', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('uses the saved language and theme', () => {
    setLanguagePreference('ar')
    setThemePreference('light')

    expect(getLanguagePreference()).toBe('ar')
    expect(getThemePreference()).toBe('light')
  })

  it('falls back when saved values are unsupported', () => {
    localStorage.setItem('auran.language', 'fr')
    localStorage.setItem('auran.theme', 'purple')

    expect(getLanguagePreference()).toBe('en')
    expect(getThemePreference()).toBe('dark')
  })

  it('keeps the app usable when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage blocked')
    })

    expect(getLanguagePreference()).toBe('en')
    expect(getThemePreference()).toBe('dark')
    expect(() => setLanguagePreference('ar')).not.toThrow()
    expect(() => setThemePreference('light')).not.toThrow()
  })
})
