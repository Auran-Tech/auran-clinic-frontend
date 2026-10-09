import { afterEach, describe, expect, it } from 'vitest'
import i18n from './i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('patient care support localization', () => {
  it('translates pending documentation actions to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('pendingDocs.complete')).toBe('إكمال التوثيق')
  })

  it('translates follow-up actions to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('followUps.schedule')).toBe('جدولة المتابعة')
  })

  it('translates attachment actions to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('attachments.upload')).toBe('رفع المرفق')
  })

  it('translates medical and visit history headings', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('medicalHistory.title')).toBe('التاريخ الطبي')
    expect(i18n.t('visitHistory.title')).toBe('تاريخ الزيارات')
  })
})
