import { afterEach, describe, expect, it } from 'vitest'
import i18n from './i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('administration localization', () => {
  it('translates employee administration to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('employeesPage.title')).toBe('الموظفون والصلاحيات')
  })

  it('translates clinic settings to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('settingsPage.title')).toBe('إعدادات العيادة')
  })

  it('translates audit administration to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('auditPage.title')).toBe('سجل التدقيق')
  })
})
