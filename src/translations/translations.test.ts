import { createInstance } from 'i18next'
import { describe, expect, it } from 'vitest'
import { namespaces, resources } from './index'

describe('translation resources', () => {
  for (const namespace of namespaces) {
    it(`${namespace} has the same nonempty keys in English and Arabic`, () => {
      const english = resources.en[namespace]
      const arabic = resources.ar[namespace]
      expect(Object.keys(arabic).sort()).toEqual(Object.keys(english).sort())
      for (const value of [...Object.values(english), ...Object.values(arabic)]) {
        expect(value.trim()).not.toBe('')
      }
    })
  }

  it('resolves module namespaces in both languages', async () => {
    const instance = createInstance()
    await instance.init({
      lng: 'en',
      fallbackLng: 'en',
      ns: [...namespaces],
      defaultNS: 'common',
      resources,
    })

    expect(instance.t('common:dashboard')).toBe('Dashboard')
    expect(instance.t('shell:signOut')).toBe('Sign out')
    await instance.changeLanguage('ar')
    expect(instance.t('common:dashboard')).toBe('لوحة المتابعة')
    expect(instance.t('shell:signOut')).toBe('تسجيل الخروج')
  })
})
