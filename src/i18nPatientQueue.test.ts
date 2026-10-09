import { afterEach, describe, expect, it } from 'vitest'
import i18n from './i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('patient and queue localization', () => {
  it('translates login copy to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('auth.signIn')).toBe('تسجيل الدخول')
  })

  it('translates patient registration copy to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('patients.addPatient')).toBe('إضافة مريض')
  })

  it('translates queue copy to Arabic', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('queuePage.title')).toBe('قائمة الانتظار')
  })

  it('keeps English copy available', async () => {
    await i18n.changeLanguage('en')
    expect(i18n.t('patientDetails.checkIn')).toBe('Check in patient')
  })
})
