import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getDashboardSummary } from '../reporting/api'

interface HomeCard {
  titleKey: string
  descriptionKey: string
  to: string
  permission?: string
}

const cards: HomeCard[] = [
  {
    titleKey: 'home.cards.patientsTitle',
    descriptionKey: 'home.cards.patientsDescription',
    to: '/patients',
    permission: 'Patient_View',
  },
  {
    titleKey: 'home.cards.queueTitle',
    descriptionKey: 'home.cards.queueDescription',
    to: '/queue',
    permission: 'Queue_View',
  },
  {
    titleKey: 'home.cards.pendingTitle',
    descriptionKey: 'home.cards.pendingDescription',
    to: '/pending-documentation',
    permission: 'Visit_View',
  },
  {
    titleKey: 'home.cards.followUpsTitle',
    descriptionKey: 'home.cards.followUpsDescription',
    to: '/follow-ups',
    permission: 'FollowUp_View',
  },
  {
    titleKey: 'home.cards.employeesTitle',
    descriptionKey: 'home.cards.employeesDescription',
    to: '/employees',
  },
  {
    titleKey: 'home.cards.reportsTitle',
    descriptionKey: 'home.cards.reportsDescription',
    to: '/reports',
    permission: 'Reports_View',
  },
  {
    titleKey: 'home.cards.settingsTitle',
    descriptionKey: 'home.cards.settingsDescription',
    to: '/settings',
    permission: 'Settings_View',
  },
  {
    titleKey: 'home.cards.guideTitle',
    descriptionKey: 'home.cards.guideDescription',
    to: '/guide',
  },
]

export function ClinicHomePage() {
  const auth = useAuth()
  const { t } = useTranslation()
  const canViewReports = auth.hasPermission('Reports_View')

  const dashboardQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    enabled: canViewReports,
    refetchInterval: 60_000,
  })

  const visibleCards = cards.filter((card) => {
    if (card.to === '/employees') {
      return auth.hasPermission('Users_View') || auth.hasPermission('RBAC_View')
    }

    return !card.permission || auth.hasPermission(card.permission)
  })

  return (
    <main className="page-shell clinic-home">
      <section className="home-hero">
        <div>
          <p className="eyebrow">Auran Clinic</p>
          <h1>{t('home.welcome', { name: auth.session?.user.fullName ?? '' })}</h1>
          <p className="muted">{t('home.intro')}</p>
        </div>
        <Link className="button secondary nav-button" to="/guide">
          {t('home.systemGuide')}
        </Link>
      </section>

      {canViewReports && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('home.todayAtGlance')}</h2>
              <p className="muted">{t('home.todayIntro')}</p>
            </div>
            <Link className="button secondary nav-button" to="/reports">
              {t('home.openReports')}
            </Link>
          </div>

          {dashboardQuery.isLoading && <p className="state">{t('home.loadingSummary')}</p>}
          {dashboardQuery.isError && (
            <p className="state error">{t('home.summaryError')}</p>
          )}

          {dashboardQuery.data && (
            <>
              <div className="dashboard-date">
                {t('home.clinicLocalDate')}: <strong>{dashboardQuery.data.localDate}</strong>
              </div>
              <div className="kpi-grid home-kpi-grid">
                <article className="kpi-card">
                  <span>{t('home.visitsToday')}</span>
                  <strong>{dashboardQuery.data.visitsToday}</strong>
                </article>
                <article className="kpi-card">
                  <span>{t('home.activeQueue')}</span>
                  <strong>{dashboardQuery.data.activeQueue}</strong>
                </article>
                <article className="kpi-card">
                  <span>{t('home.pendingDocumentation')}</span>
                  <strong>{dashboardQuery.data.pendingDocumentation}</strong>
                </article>
                <article className="kpi-card">
                  <span>{t('home.followUpsToday')}</span>
                  <strong>{dashboardQuery.data.followUpsToday}</strong>
                </article>
                <article className="kpi-card kpi-attention">
                  <span>{t('home.overdueFollowUps')}</span>
                  <strong>{dashboardQuery.data.overdueFollowUps}</strong>
                </article>
              </div>
            </>
          )}
        </section>
      )}

      <section className="home-workflows">
        <div className="panel-heading">
          <div>
            <h2>{t('home.yourWorkflows')}</h2>
            <p className="muted">{t('home.workflowsIntro')}</p>
          </div>
        </div>

        <div className="home-card-grid">
          {visibleCards.map((card) => (
            <Link className="home-card" key={card.to} to={card.to}>
              <div>
                <h3>{t(card.titleKey)}</h3>
                <p className="muted">{t(card.descriptionKey)}</p>
              </div>
              <span className="home-card-action" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
