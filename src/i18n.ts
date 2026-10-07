import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const storedLanguage = localStorage.getItem('auran.language')
const initialLanguage = storedLanguage === 'ar' ? 'ar' : 'en'

void i18n.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        language: {
          english: 'English',
          arabic: 'العربية',
          switchToEnglish: 'Switch to English',
          switchToArabic: 'التبديل إلى العربية',
        },
        common: {
          dashboard: 'Dashboard',
          patients: 'Patients',
          queue: 'Live queue',
          followUps: 'Follow-ups',
          pendingDocumentation: 'Pending documentation',
          employees: 'Employees',
          settings: 'Settings',
          audit: 'Audit',
        },
      },
    },
    ar: {
      translation: {
        language: {
          english: 'English',
          arabic: 'العربية',
          switchToEnglish: 'Switch to English',
          switchToArabic: 'التبديل إلى العربية',
        },
        common: {
          dashboard: 'لوحة المتابعة',
          patients: 'المرضى',
          queue: 'قائمة الانتظار',
          followUps: 'المتابعات',
          pendingDocumentation: 'التوثيق المعلق',
          employees: 'الموظفون',
          settings: 'الإعدادات',
          audit: 'سجل التدقيق',
        },
      },
    },
  },
})

export default i18n
