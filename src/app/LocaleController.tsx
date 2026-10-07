import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function LocaleController() {
  const { i18n, t } = useTranslation()
  const isArabic = i18n.resolvedLanguage === 'ar'

  useEffect(() => {
    document.documentElement.lang = isArabic ? 'ar' : 'en'
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
    localStorage.setItem('auran.language', isArabic ? 'ar' : 'en')
  }, [isArabic])

  return (
    <button
      type="button"
      className="locale-switch"
      aria-label={isArabic ? t('language.switchToEnglish') : t('language.switchToArabic')}
      onClick={() => void i18n.changeLanguage(isArabic ? 'en' : 'ar')}
    >
      {isArabic ? t('language.english') : t('language.arabic')}
    </button>
  )
}
