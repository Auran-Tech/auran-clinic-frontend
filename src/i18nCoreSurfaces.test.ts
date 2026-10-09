import { afterEach, describe, expect, it } from 'vitest'
import i18n from './i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('core surface localization', () => {
  it('renders English home copy', async () => {
    await i18n.changeLanguage('en')
    expect(i18n.t('home.todayAtGlance')).toBe('Today at a glance')
  })

  it('renders Arabic home copy', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('home.todayAtGlance')).toBe('ملخص اليوم')
  })

  it('keeps API-independent report labels localized', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('reporting.exportCsv')).toBe('تصدير CSV')
  })
})
