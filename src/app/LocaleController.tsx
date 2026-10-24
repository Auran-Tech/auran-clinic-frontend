import './LocaleController.css'
import { useTranslation } from 'react-i18next'

export function LocaleController({ mode = 'switch' }: { mode?: 'switch' | 'segmented' }) {
  const { i18n, t } = useTranslation('language')
  const isArabic = i18n.resolvedLanguage === 'ar'

  if (mode === 'segmented') {
    return (
      <div className="locale-segmented" role="group" aria-label={t('language')}>
        <button
          type="button"
          className={isArabic ? 'active' : ''}
          aria-pressed={isArabic}
          onClick={() => void i18n.changeLanguage('ar')}
        >
          AR
        </button>
        <button
          type="button"
          className={isArabic ? '' : 'active'}
          aria-pressed={!isArabic}
          onClick={() => void i18n.changeLanguage('en')}
        >
          EN
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="locale-switch"
      aria-label={isArabic ? t('switchToEnglish') : t('switchToArabic')}
      onClick={() => void i18n.changeLanguage(isArabic ? 'en' : 'ar')}
    >
      {isArabic ? t('english') : t('arabic')}
    </button>
  )
}
