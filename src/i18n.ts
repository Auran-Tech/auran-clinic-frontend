import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  getLanguagePreference,
  setLanguagePreference,
  type AppLanguage,
} from './lib/preferences'
import { namespaces, resources } from './translations'

const initialLanguage = getLanguagePreference()

function applyLanguage(language: string) {
  const selectedLanguage: AppLanguage = language === 'ar' ? 'ar' : 'en'
  setLanguagePreference(selectedLanguage)

  if (typeof document !== 'undefined') {
    document.documentElement.lang = selectedLanguage
    document.documentElement.dir = selectedLanguage === 'ar' ? 'rtl' : 'ltr'
  }
}

i18n.on('languageChanged', applyLanguage)

void i18n.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: 'en',
  ns: [...namespaces],
  defaultNS: 'common',
  resources,
  interpolation: { escapeValue: false },
})

export default i18n
