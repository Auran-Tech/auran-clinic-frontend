import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export function NotFoundPage() {
  const auth = useAuth()
  const { t } = useTranslation()

  return (
    <main className="not-found-page">
      <section className="panel not-found-card">
        <p className="eyebrow">Auran Clinic</p>
        <h1>{t('notFound.title')}</h1>
        <p className="muted">{t('notFound.text')}</p>

        <div className="actions">
          <Link className="button primary nav-button" to="/patients">
            {t('notFound.patients')}
          </Link>
          <Link className="button secondary nav-button" to="/guide">
            {t('notFound.guide')}
          </Link>
          {auth.hasPermission('Reports_View') && (
            <Link className="button secondary nav-button" to="/reports">
              {t('notFound.dashboard')}
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
