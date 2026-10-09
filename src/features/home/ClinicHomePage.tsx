import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getDashboardSummary } from '../reporting/api'

interface HomeCard {
  title: string
  description: string
  to: string
  permission?: string
}

const cards: HomeCard[] = [
  {
    title: 'Patients',
    description: 'Find patients, review profiles, check in visits, and manage attachments.',
    to: '/patients',
    permission: 'Patient_View',
  },
  {
    title: 'Live queue',
    description: 'Track active visits and move patients through clinic workflow stages.',
    to: '/queue',
    permission: 'Queue_View',
  },
  {
    title: 'Pending documentation',
    description: 'Finish clinical notes that still require documentation.',
    to: '/pending-documentation',
    permission: 'Visit_View',
  },
  {
    title: 'Follow-ups',
    description: 'Review due, overdue, upcoming, and completed follow-up work.',
    to: '/follow-ups',
    permission: 'FollowUp_View',
  },
  {
    title: 'Employees & access',
    description: 'Manage clinic staff and role assignments.',
    to: '/employees',
  },
  {
    title: 'Dashboard & reports',
    description: 'Review clinic KPIs and visit-level reporting.',
    to: '/reports',
    permission: 'Reports_View',
  },
  {
    title: 'Clinic settings',
    description: 'Configure clinic behavior, workflows, fields, and localization.',
    to: '/settings',
    permission: 'Settings_View',
  },
  {
    title: 'System guide',
    description: 'Open the role-aware guide for the main Auran Clinic workflows.',
    to: '/guide',
  },
]

export function ClinicHomePage() {
  const auth = useAuth()
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
          <h1>Welcome, {auth.session?.user.fullName}</h1>
          <p className="muted">
            Choose a workflow below or use today’s clinic summary to decide what needs attention first.
          </p>
        </div>
        <Link className="button secondary nav-button" to="/guide">
          System guide
        </Link>
      </section>

      {canViewReports && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Today at a glance</h2>
              <p className="muted">
                Live operational metrics based on the clinic’s configured local date.
              </p>
            </div>
            <Link className="button secondary nav-button" to="/reports">
              Open reports
            </Link>
          </div>

          {dashboardQuery.isLoading && <p className="state">Loading clinic summary…</p>}
          {dashboardQuery.isError && (
            <p className="state error">Unable to load clinic summary.</p>
          )}

          {dashboardQuery.data && (
            <>
              <div className="dashboard-date">
                Clinic local date: <strong>{dashboardQuery.data.localDate}</strong>
              </div>
              <div className="kpi-grid home-kpi-grid">
                <article className="kpi-card">
                  <span>Visits today</span>
                  <strong>{dashboardQuery.data.visitsToday}</strong>
                </article>
                <article className="kpi-card">
                  <span>Active queue</span>
                  <strong>{dashboardQuery.data.activeQueue}</strong>
                </article>
                <article className="kpi-card">
                  <span>Pending documentation</span>
                  <strong>{dashboardQuery.data.pendingDocumentation}</strong>
                </article>
                <article className="kpi-card">
                  <span>Follow-ups today</span>
                  <strong>{dashboardQuery.data.followUpsToday}</strong>
                </article>
                <article className="kpi-card kpi-attention">
                  <span>Overdue follow-ups</span>
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
            <h2>Your workflows</h2>
            <p className="muted">
              Only workflows available to your current permissions are shown.
            </p>
          </div>
        </div>

        <div className="home-card-grid">
          {visibleCards.map((card) => (
            <Link className="home-card" key={card.to} to={card.to}>
              <div>
                <h3>{card.title}</h3>
                <p className="muted">{card.description}</p>
              </div>
              <span className="home-card-action" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
