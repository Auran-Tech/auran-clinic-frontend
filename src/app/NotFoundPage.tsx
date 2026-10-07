import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export function NotFoundPage() {
  const auth = useAuth()

  return (
    <main className="not-found-page">
      <section className="panel not-found-card">
        <p className="eyebrow">Auran Clinic</p>
        <h1>Page not found</h1>
        <p className="muted">
          This route does not exist or is no longer available.
        </p>

        <div className="actions">
          <Link className="button primary nav-button" to="/patients">
            Go to patients
          </Link>
          <Link className="button secondary nav-button" to="/guide">
            Open system guide
          </Link>
          {auth.hasPermission('Reports_View') && (
            <Link className="button secondary nav-button" to="/reports">
              Open dashboard
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
