// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import i18n from '../i18n'

describe('language preference', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('persists language and updates document direction on every language change', async () => {
    await i18n.changeLanguage('ar')

    expect(localStorage.getItem('auran.language')).toBe('ar')
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')

    await i18n.changeLanguage('en')

    expect(localStorage.getItem('auran.language')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
  })
})
