import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getDashboardSummary } from '../reporting/api'

const metrics = [
  { key: 'totalPatients', label: 'Total patients', permission: 'Patient_View' },
  { key: 'visitsToday', label: 'Visits today', permission: 'Visit_View' },
  { key: 'activeQueue', label: 'Active queue', permission: 'Queue_View' },
  { key: 'completedVisitsToday', label: 'Completed visits today', permission: 'Visit_View' },
  { key: 'pendingDocumentation', label: 'Pending documentation', permission: 'Visit_View' },
  { key: 'followUpsToday', label: 'Follow-ups today', permission: 'FollowUps_View' },
  { key: 'overdueFollowUps', label: 'Overdue follow-ups', permission: 'FollowUps_View' },
] as const

export function DashboardPage() {
  const auth = useAuth()
  const canView = auth.hasPermission('Reports_View')
  const summary = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    enabled: canView,
    refetchInterval: 60_000,
  })

  if (!canView) {
    return <main className="page-shell"><p className="state error" role="alert">You do not have permission to view the dashboard.</p></main>
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Clinic overview</p>
          <h1>Dashboard</h1>
          <p className="muted">Clinic-scoped operational indicators for the current local day.</p>
        </div>
        <div className="actions">
          {auth.hasPermission('Patient_View') && <Link className="button secondary nav-button" to="/patients">Patients</Link>}
          {auth.hasPermission('Queue_View') && <Link className="button secondary nav-button" to="/queue">Queue</Link>}
          {auth.hasPermission('Reports_View') && <Link className="button secondary nav-button" to="/reports">Reports</Link>}
          <button className="button secondary" onClick={() => void auth.signOut()}>Sign out</button>
        </div>
      </section>
      {summary.isLoading && <p className="state" role="status">Loading dashboard…</p>}
      {summary.isError && <p className="state error" role="alert">Unable to load dashboard. Please retry.</p>}
      {summary.data && (
        <>
          <p className="dashboard-date">Clinic local date: <strong>{summary.data.localDate}</strong></p>
          <section className="kpi-grid" aria-label="Clinic operational metrics">
            {metrics.filter(metric => auth.hasPermission(metric.permission)).map(metric => (
              <article className="kpi-card" key={metric.key}>
                <span>{metric.label}</span>
                <strong>{summary.data[metric.key]}</strong>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  )
}
