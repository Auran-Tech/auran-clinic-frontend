import { afterEach, describe, expect, it } from 'vitest'
import i18n from './i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('clinical workspace localization', () => {
  it('translates clinical session actions to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('clinicalWorkspace.start')).toBe('بدء جلسة سريرية')
  })

  it('translates measurement actions to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('measurements.record')).toBe('تسجيل القياسات')
  })

  it('translates clinical order actions to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('clinicalOrders.save')).toBe('حفظ الأمر السريري')
  })

  it('translates order attachment actions to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('orderAttachments.link')).toBe('ربط المرفق')
  })
})
