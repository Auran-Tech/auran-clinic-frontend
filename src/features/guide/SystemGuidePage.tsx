import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface GuideCard {
  title: string
  description: string
  to: string
  permission?: string
}

const cards: GuideCard[] = [
  {
    title: 'Patients',
    description: 'Find, create, review, and update patient profiles before starting a visit.',
    to: '/patients',
    permission: 'Patient_View',
  },
  {
    title: 'Live queue',
    description: 'Track active visits and move patients through configured clinic workflow stages.',
    to: '/queue',
    permission: 'Queue_View',
  },
  {
    title: 'Pending documentation',
    description: 'Finish Draft or Pending clinical notes after the operational visit has ended.',
    to: '/pending-documentation',
    permission: 'Visit_View',
  },
  {
    title: 'Follow-ups',
    description: 'Review today, upcoming, overdue, and completed patient follow-up recommendations.',
    to: '/follow-ups',
    permission: 'FollowUp_View',
  },
  {
    title: 'Employees & RBAC',
    description: 'Manage clinic staff accounts, status, and protected system-role assignments.',
    to: '/employees',
  },
  {
    title: 'Clinic settings',
    description: 'Configure branding, localization, workflow stages, contact details, and clinical defaults.',
    to: '/settings',
    permission: 'Settings_View',
  },
  {
    title: 'Dashboard & reports',
    description: 'Review operational KPIs, filter visit activity, and export permitted reports.',
    to: '/reports',
    permission: 'Reports_View',
  },
  {
    title: 'Audit log',
    description: 'Review sensitive administrative and clinical actions recorded for the clinic.',
    to: '/audit',
    permission: 'Audit_View',
  },
]

export function SystemGuidePage() {
  const auth = useAuth()

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
          <p className="eyebrow">Help</p>
          <h1>System guide</h1>
          <p className="muted">
            Use this guide as a role-aware map of the main Auran Clinic workflows.
          </p>
        </div>
        <Link className="button secondary nav-button" to="/patients">
          Patients
        </Link>
      </section>

      <section className="guide-intro panel">
        <h2>Recommended daily flow</h2>
        <ol className="guide-steps">
          <li>Find or create the patient.</li>
          <li>Start the visit and check the patient into the clinic queue.</li>
          <li>Move the patient through the configured workflow stages.</li>
          <li>Document clinical sessions and orders as care is delivered.</li>
          <li>Complete or mark documentation pending before/after exit.</li>
          <li>Schedule follow-up when further review is needed.</li>
        </ol>
      </section>

      <section className="guide-grid">
        {visibleCards.map((card) => (
          <article className="guide-card" key={card.to}>
            <div>
              <h2>{card.title}</h2>
              <p className="muted">{card.description}</p>
            </div>
            <Link className="button secondary nav-button" to={card.to}>
              Open
            </Link>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>Access & safety rules</h2>
        <p className="muted">
          The backend is always the source of truth for permissions and clinic isolation.
          Navigation and buttons only improve the user experience; they do not replace API authorization.
        </p>
      </section>
    </main>
  )
}
