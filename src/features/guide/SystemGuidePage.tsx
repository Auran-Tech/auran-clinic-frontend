import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface GuideCard {
  titleKey: string
  descriptionKey: string
  to: string
  permission?: string
}

const cards: GuideCard[] = [
  {
    titleKey: 'common.patients',
    descriptionKey: 'guide.cards.patientsDescription',
    to: '/patients',
    permission: 'Patient_View',
  },
  {
    titleKey: 'common.queue',
    descriptionKey: 'guide.cards.queueDescription',
    to: '/queue',
    permission: 'Queue_View',
  },
  {
    titleKey: 'common.pendingDocumentation',
    descriptionKey: 'guide.cards.pendingDescription',
    to: '/pending-documentation',
    permission: 'Visit_View',
  },
  {
    titleKey: 'common.followUps',
    descriptionKey: 'guide.cards.followUpsDescription',
    to: '/follow-ups',
    permission: 'FollowUp_View',
  },
  {
    titleKey: 'guide.cards.employeesTitle',
    descriptionKey: 'guide.cards.employeesDescription',
    to: '/employees',
  },
  {
    titleKey: 'common.settings',
    descriptionKey: 'guide.cards.settingsDescription',
    to: '/settings',
    permission: 'Settings_View',
  },
  {
    titleKey: 'guide.cards.reportsTitle',
    descriptionKey: 'guide.cards.reportsDescription',
    to: '/reports',
    permission: 'Reports_View',
  },
  {
    titleKey: 'guide.cards.auditTitle',
    descriptionKey: 'guide.cards.auditDescription',
    to: '/audit',
    permission: 'Audit_View',
  },
]

export function SystemGuidePage() {
  const auth = useAuth()
  const { t } = useTranslation()

  const visibleCards = cards.filter((card) => {
    if (card.to === '/employees') {
      return auth.hasPermission('Users_View') || auth.hasPermission('RBAC_View')
    }
    return !card.permission || auth.hasPermission(card.permission)
  })

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('guide.eyebrow')}</p>
          <h1>{t('guide.title')}</h1>
          <p className="muted">{t('guide.intro')}</p>
        </div>
        <Link className="button secondary nav-button" to="/patients">
          {t('common.patients')}
        </Link>
      </section>

      <section className="guide-intro panel">
        <h2>{t('guide.recommendedFlow')}</h2>
        <ol className="guide-steps">
          <li>{t('guide.steps.patient')}</li>
          <li>{t('guide.steps.checkIn')}</li>
          <li>{t('guide.steps.workflow')}</li>
          <li>{t('guide.steps.clinical')}</li>
          <li>{t('guide.steps.documentation')}</li>
          <li>{t('guide.steps.followUp')}</li>
        </ol>
      </section>

      <section className="guide-grid">
        {visibleCards.map((card) => (
          <article className="guide-card" key={card.to}>
            <div>
              <h2>{t(card.titleKey)}</h2>
              <p className="muted">{t(card.descriptionKey)}</p>
            </div>
            <Link className="button secondary nav-button" to={card.to}>
              {t('common.open')}
            </Link>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>{t('guide.accessTitle')}</h2>
        <p className="muted">{t('guide.accessText')}</p>
      </section>
    </main>
  )
}
