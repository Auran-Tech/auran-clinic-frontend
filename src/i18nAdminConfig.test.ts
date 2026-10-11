import { afterEach, describe, expect, it } from 'vitest'
import i18n from './i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('nested administration localization', () => {
  it('translates workflow configuration', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('adminConfig.workflow.title')).toBe('سير عمل العيادة')
  })

  it('translates patient profile configuration', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('adminConfig.patientProfile.title')).toBe('إعدادات ملف المريض')
  })

  it('translates clinical measurement configuration', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('adminConfig.clinicalFields.title')).toBe('إعدادات القياسات السريرية')
  })

  it('translates clinical order section configuration', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('adminConfig.orderSections.title')).toBe('أقسام الأوامر السريرية')
  })
})
