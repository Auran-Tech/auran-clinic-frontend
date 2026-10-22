import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { namespaces, resources } from './translations'

const storedLanguage = localStorage.getItem('auran.language')
const initialLanguage = storedLanguage === 'ar' ? 'ar' : 'en'

void i18n.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: 'en',
  ns: [...namespaces],
  defaultNS: 'common',
  resources,
  interpolation: { escapeValue: false },
})

export default i18n
