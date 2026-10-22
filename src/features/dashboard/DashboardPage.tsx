import './dashboard.css'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getActiveQueue } from '../queue/api'
import { getDashboardSummary } from '../reporting/api'

const metrics = [
  { key: 'totalPatients', permission: 'Patient_View' },
  { key: 'visitsToday', permission: 'Visit_View' },
  { key: 'activeQueue', permission: 'Queue_View' },
  { key: 'completedVisitsToday', permission: 'Visit_View' },
  { key: 'pendingDocumentation', permission: 'Visit_View' },
  { key: 'followUpsToday', permission: 'FollowUp_View' },
  { key: 'overdueFollowUps', permission: 'FollowUp_View' },
] as const

export function DashboardPage() {
  const auth = useAuth()
  const { t } = useTranslation('dashboard')
  const canView = auth.hasPermission('Reports_View')
  const canViewQueue = auth.hasPermission('Queue_View')
  const summary = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    enabled: canView,
    refetchInterval: 60_000,
  })
  const queue = useQuery({
    queryKey: ['active-queue'],
    queryFn: getActiveQueue,
    enabled: canView && canViewQueue,
    refetchInterval: 30_000,
  })

  if (!canView)
    return (
      <main className="page-shell">
        <p className="state error" role="alert">
          {t('forbidden')}
        </p>
      </main>
    )

  const queueEntries = queue.data ?? []
  const stages = Object.values(
    queueEntries.reduce<Record<string, { name: string; count: number; color: string }>>(
      (groups, item) => {
        const key = item.workflowStatusId
        if (!groups[key])
          groups[key] = {
            name: item.workflowStatusName,
            count: 0,
            color: item.workflowStatusColor,
          }
        groups[key].count += 1
        return groups
      },
      {},
    ),
  )
  const doctors = Object.values(
    queueEntries.reduce<Record<string, { name: string; count: number }>>(
      (groups, item) => {
        if (!item.doctorId) return groups
        if (!groups[item.doctorId])
          groups[item.doctorId] = { name: item.doctorName || item.doctorId, count: 0 }
        groups[item.doctorId].count += 1
        return groups
      },
      {},
    ),
  ).sort((a, b) => b.count - a.count)

  return (
    <main className="page-shell">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">{t('overview')}</p>
          <h1>{t('title')}</h1>
          <p className="muted">{t('subtitle')}</p>
        </div>
        <div className="dashboard-hero-actions">
          {summary.data && (
            <p className="dashboard-date">
              {t('localDate')} <strong>{summary.data.localDate}</strong>
            </p>
          )}
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              void summary.refetch()
              if (canViewQueue) void queue.refetch()
            }}
          >
            {t('refresh')}
          </button>
        </div>
      </section>
      {summary.isLoading && (
        <p className="state" role="status">
          {t('loading')}
        </p>
      )}
      {summary.isError && (
        <p className="state error" role="alert">
          {t('error')}
        </p>
      )}
      {summary.data && (
        <>
          <section className="kpi-grid" aria-label="Clinic operational metrics">
            {metrics
              .filter((metric) => auth.hasPermission(metric.permission))
              .map((metric) => (
                <article className="kpi-card" key={metric.key}>
                  <span>{t(metric.key)}</span>
                  <strong>{summary.data[metric.key]}</strong>
                  <span className="kpi-card-day">{t('today')}</span>
                </article>
              ))}
          </section>
          <div className="dashboard-panels">
            <section className="panel dashboard-work-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <p className="eyebrow">{t('liveOperations')}</p>
                  <h2>{t('needsAttention')}</h2>
                </div>
                <span className="dashboard-live-badge">{t('today')}</span>
              </div>
              {canViewQueue && (
                <Link to="/queue" className="dashboard-work-row">
                  <span>
                    <strong>{t('currentQueue')}</strong>
                    <small>{t('patientsInQueue')}</small>
                  </span>
                  <b>{summary.data.activeQueue}</b>
                </Link>
              )}
              {auth.hasPermission('Visit_View') && (
                <Link to="/pending-documentation" className="dashboard-work-row">
                  <span>
                    <strong>{t('documentationToFinish')}</strong>
                    <small>{t('visitsAwaitingDocs')}</small>
                  </span>
                  <b>{summary.data.pendingDocumentation}</b>
                </Link>
              )}
              {auth.hasPermission('FollowUp_View') && (
                <Link to="/follow-ups" className="dashboard-work-row">
                  <span>
                    <strong>{t('followUpsPastDue')}</strong>
                    <small>{t('pastRecommendedDate')}</small>
                  </span>
                  <b>{summary.data.overdueFollowUps}</b>
                </Link>
              )}
            </section>
            <section className="panel dashboard-quick-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <p className="eyebrow">{t('workspace')}</p>
                  <h2>{t('quickActions')}</h2>
                </div>
              </div>
              <p className="muted">{t('continueWorkflow')}</p>
              <div className="dashboard-quick-links">
                {auth.hasPermission('Patient_View') && (
                  <Link to="/patients">
                    {t('patients')} <span aria-hidden="true">↗</span>
                  </Link>
                )}
                {canViewQueue && (
                  <Link to="/queue">
                    {t('liveQueue')} <span aria-hidden="true">↗</span>
                  </Link>
                )}
                {auth.hasPermission('FollowUp_View') && (
                  <Link to="/follow-ups">
                    {t('followUps')} <span aria-hidden="true">↗</span>
                  </Link>
                )}
                <Link to="/reports">
                  {t('reports')} <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </section>
          </div>
          {canViewQueue && (
            <div className="dashboard-panels dashboard-operational-grid">
              <section className="panel">
                <div className="dashboard-panel-heading">
                  <div>
                    <p className="eyebrow">{t('liveQueue')}</p>
                    <h2>{t('queueDistribution')}</h2>
                    <small className="muted">{t('currentStages')}</small>
                  </div>
                  <Link to="/queue">{t('openQueue')}</Link>
                </div>
                {queue.isError && (
                  <p className="state error" role="alert">
                    {t('queueError')}
                  </p>
                )}
                {queue.isLoading && (
                  <p className="state" role="status">
                    {t('loading')}
                  </p>
                )}
                {queue.isSuccess &&
                  (stages.length ? (
                    stages.map((stage) => (
                      <div className="dashboard-bar-row" key={stage.name}>
                        <div>
                          <strong>{stage.name}</strong>
                          <b>{stage.count}</b>
                        </div>
                        <div className="dashboard-bar-track">
                          <span
                            style={{
                              width: `${(stage.count / queueEntries.length) * 100}%`,
                              backgroundColor: stage.color || '#4c8dff',
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted">{t('noQueue')}</p>
                  ))}
              </section>
              <section className="panel">
                <div className="dashboard-panel-heading">
                  <div>
                    <p className="eyebrow">{t('liveOperations')}</p>
                    <h2>{t('doctorWorkload')}</h2>
                    <small className="muted">{t('activePatients')}</small>
                  </div>
                </div>
                {queue.isSuccess &&
                  (doctors.length ? (
                    doctors.map((doctor) => (
                      <div className="dashboard-bar-row" key={doctor.name}>
                        <div>
                          <strong>{doctor.name}</strong>
                          <b>{doctor.count}</b>
                        </div>
                        <div className="dashboard-bar-track">
                          <span
                            style={{
                              width: `${(doctor.count / queueEntries.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted">{t('noQueue')}</p>
                  ))}
              </section>
              <section className="panel dashboard-arrivals">
                <div className="dashboard-panel-heading">
                  <div>
                    <p className="eyebrow">{t('liveOperations')}</p>
                    <h2>{t('recentArrivals')}</h2>
                    <small className="muted">{t('patientsMoving')}</small>
                  </div>
                </div>
                {queue.isSuccess &&
                  (queueEntries.length ? (
                    queueEntries.slice(0, 5).map((item) => (
                      <Link
                        className="dashboard-arrival"
                        to={`/patients/${item.patientId}`}
                        key={item.queueEntryId}
                      >
                        <span
                          className="dashboard-arrival-dot"
                          style={{
                            backgroundColor: item.workflowStatusColor || '#4c8dff',
                          }}
                        />
                        <span>
                          <strong>{item.patientName}</strong>
                          <small>
                            {item.patientNumber} · {item.workflowStatusName}
                          </small>
                        </span>
                        <span aria-hidden="true">↗</span>
                      </Link>
                    ))
                  ) : (
                    <p className="muted">{t('noQueue')}</p>
                  ))}
              </section>
            </div>
          )}
        </>
      )}
    </main>
  )
}
