import './dashboard.css'
import type { CSSProperties, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  FileText,
  RefreshCw,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getActiveQueue } from '../queue/api'
import { getDashboardSummary } from '../reporting/api'
import { DashboardTrendChart } from './DashboardTrendChart'
import {
  averageTimeInFlow,
  groupDoctorLoad,
  groupQueueStages,
  parseUtcTimestamp,
  queueDonutGradient,
} from './dashboardData'

interface MetricCardProps {
  title: string
  value: string | number
  caption: string
  accent: string
  icon: LucideIcon
  percent?: number | null
  to: string
}

function MetricCard({
  title,
  value,
  caption,
  accent,
  icon: Icon,
  percent,
  to,
}: MetricCardProps) {
  const style = {
    '--dashboard-ring-color': accent,
    '--dashboard-ring-fill': `${percent ?? 100}%`,
  } as CSSProperties

  return (
    <Link className="dashboard-metric-card" style={style} to={to}>
      <div className="dashboard-metric-ring" aria-hidden="true">
        <span>
          {percent === null || percent === undefined ? (
            <Icon size={22} strokeWidth={1.8} />
          ) : (
            `${percent}%`
          )}
        </span>
      </div>
      <div className="dashboard-metric-copy">
        <small>{title}</small>
        <strong>{value}</strong>
        <span>{caption}</span>
      </div>
    </Link>
  )
}

function DashboardPanelHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle: string
  action?: ReactNode
}) {
  return (
    <div className="dashboard-panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

export function DashboardPage() {
  const auth = useAuth()
  const { t } = useTranslation('dashboard')
  const canView = auth.hasPermission('Reports_View')
  const canViewVisits = auth.hasPermission('Visit_View')
  const canViewQueue = auth.hasPermission('Queue_View')
  const canViewFollowUps = auth.hasPermission('FollowUp_View')
  const canViewPatients = auth.hasPermission('Patient_View')
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

  if (!canView) {
    return (
      <main className="page-shell dashboard-page">
        <p className="state error" role="alert">
          {t('forbidden')}
        </p>
      </main>
    )
  }

  const data = summary.data
  const queueEntries = queue.data ?? []
  const stages = groupQueueStages(queueEntries)
  const doctors = groupDoctorLoad(queueEntries, t('unassigned'))
  const timeInFlow = averageTimeInFlow(queueEntries)
  const completionPercent =
    data && data.visitsToday > 0
      ? Math.round((data.completedVisitsStartedToday / data.visitsToday) * 100)
      : null
  const recentEntries = [...queueEntries]
    .sort(
      (first, second) =>
        (parseUtcTimestamp(second.entryAtUtc) ?? 0) -
        (parseUtcTimestamp(first.entryAtUtc) ?? 0),
    )
    .slice(0, 4)
  const weeklyVisitCount =
    data?.weeklyVisits?.reduce((total, day) => total + day.count, 0) ?? 0

  function workflowStatusName(name: string) {
    switch (name.toLowerCase()) {
      case 'waiting':
        return t('waiting')
      case 'with doctor':
        return t('statusWithDoctor')
      case 'waiting for drops':
        return t('statusWaitingDrops')
      case 'ready for recheck':
        return t('statusReadyRecheck')
      default:
        return name
    }
  }

  function flowDuration(minutes: number) {
    if (minutes < 60) return t('minuteValue', { value: minutes })
    if (minutes < 1_440) {
      return t('hourMinuteValue', {
        hours: Math.floor(minutes / 60),
        minutes: minutes % 60,
      })
    }
    return t('dayHourValue', {
      days: Math.floor(minutes / 1_440),
      hours: Math.floor((minutes % 1_440) / 60),
    })
  }

  function relativeArrival(value: string) {
    const timestamp = parseUtcTimestamp(value)
    if (timestamp === null) return t('timeUnavailable')
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
    if (minutes < 60) return t('minutesAgo', { value: minutes })
    if (minutes >= 1_440) return t('daysAgo', { value: Math.floor(minutes / 1_440) })
    return t('hoursAgo', { value: Math.floor(minutes / 60) })
  }

  return (
    <main className="page-shell dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-breadcrumb">
          <span>{t('home')}</span>
          <span aria-hidden="true">›</span>
          <strong>{t('title')}</strong>
        </div>
        <div className="dashboard-title-row">
          <div>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          <button
            className="button secondary dashboard-refresh"
            disabled={summary.isFetching || queue.isFetching}
            onClick={() => {
              void summary.refetch()
              if (canViewQueue) void queue.refetch()
            }}
            type="button"
          >
            <RefreshCw size={16} aria-hidden="true" />
            {t('refresh')}
          </button>
        </div>
      </header>

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

      {data && (
        <>
          <section className="dashboard-metrics" aria-label={t('metrics')}>
            {canViewVisits && (
              <MetricCard
                accent="#38bdf8"
                caption={
                  data.visitsToday > 0
                    ? t('visitsStartedToday', { value: data.visitsToday })
                    : t('noVisitsToday')
                }
                icon={Activity}
                percent={completionPercent}
                title={t('visitCompletion')}
                to="/pending-documentation"
                value={data.completedVisitsStartedToday}
              />
            )}
            {canViewQueue && (
              <MetricCard
                accent="#6366f1"
                caption={t('averageTimeInFlow')}
                icon={Clock3}
                title={t('timeInFlow')}
                to="/queue"
                value={
                  queue.isLoading || timeInFlow === null ? '—' : flowDuration(timeInFlow)
                }
              />
            )}
            {canViewVisits && (
              <MetricCard
                accent="#10b981"
                caption={t('visitsStillPending')}
                icon={FileText}
                title={t('pendingDocumentation')}
                to="/pending-documentation"
                value={data.pendingDocumentation}
              />
            )}
            {canViewFollowUps && (
              <MetricCard
                accent="#3b82f6"
                caption={t('followUpsDueToday')}
                icon={CalendarDays}
                title={t('followUpsToday')}
                to="/follow-ups"
                value={data.followUpsToday}
              />
            )}
          </section>

          <div
            className={`dashboard-chart-grid ${!canViewQueue || !canViewVisits ? 'dashboard-chart-grid-single' : ''}`}
          >
            {canViewVisits && (
              <section className="dashboard-card dashboard-trend-panel">
                <DashboardPanelHeading
                  action={
                    <span className="dashboard-trend-pill">
                      {t('weeklyVisitCount', { value: weeklyVisitCount })}
                    </span>
                  }
                  subtitle={t('dailyVisitTrend')}
                  title={t('visitsDuringWeek')}
                />
                <DashboardTrendChart visits={data.weeklyVisits ?? []} />
              </section>
            )}
            {canViewQueue && (
              <section className="dashboard-card dashboard-activity-panel">
                <DashboardPanelHeading
                  action={<span className="dashboard-live-pill">{t('live')}</span>}
                  subtitle={t('latestQueueActivity')}
                  title={t('liveActivity')}
                />
                {queue.isError && <p className="state error">{t('queueError')}</p>}
                {queue.isLoading && <p className="state">{t('loadingQueue')}</p>}
                {queue.isSuccess &&
                  (recentEntries.length > 0 ? (
                    <ul className="dashboard-activity-list">
                      {recentEntries.map((entry) => (
                        <li className="dashboard-activity-item" key={entry.queueEntryId}>
                          <span
                            className="dashboard-activity-icon"
                            aria-hidden="true"
                            style={{
                              backgroundColor: stages.find(
                                (stage) => stage.id === entry.workflowStatusId,
                              )?.color,
                            }}
                          >
                            <Activity size={16} />
                          </span>
                          <div>
                            <strong>
                              {workflowStatusName(entry.workflowStatusName)}
                            </strong>
                            <span>
                              {entry.patientName} · {entry.patientNumber}
                            </span>
                          </div>
                          <small>{relativeArrival(entry.entryAtUtc)}</small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="dashboard-empty">{t('noQueue')}</p>
                  ))}
              </section>
            )}
          </div>

          {canViewQueue && (
            <div className="dashboard-detail-grid">
              <section className="dashboard-card">
                <DashboardPanelHeading
                  action={
                    <Link className="dashboard-panel-action" to="/queue">
                      {t('open')} <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  }
                  subtitle={t('currentStages')}
                  title={t('queueDistribution')}
                />
                {queue.isError && <p className="state error">{t('queueError')}</p>}
                {queue.isLoading && <p className="state">{t('loadingQueue')}</p>}
                {queue.isSuccess && (
                  <div className="dashboard-donut-layout">
                    <div
                      className="dashboard-donut"
                      role="img"
                      aria-label={t('queueTotal', { value: queueEntries.length })}
                      style={{ background: queueDonutGradient(stages) }}
                    >
                      <span>
                        <strong>{queueEntries.length}</strong>
                        <small>{t('inFlow')}</small>
                      </span>
                    </div>
                    <ul className="dashboard-stage-legend">
                      {stages.map((stage) => (
                        <li key={stage.id}>
                          <span
                            className="dashboard-legend-dot"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span>{workflowStatusName(stage.name)}</span>
                          <strong>{stage.count}</strong>
                        </li>
                      ))}
                      {stages.length === 0 && <li>{t('noQueue')}</li>}
                    </ul>
                  </div>
                )}
              </section>
              <section className="dashboard-card">
                <DashboardPanelHeading
                  action={<Users size={20} aria-hidden="true" />}
                  subtitle={t('activePatientsByDoctor')}
                  title={t('doctorWorkload')}
                />
                {queue.isSuccess &&
                  (doctors.length > 0 ? (
                    <div className="dashboard-doctor-list">
                      {doctors.map((doctor) => (
                        <div className="dashboard-doctor-row" key={doctor.id}>
                          <div>
                            <strong>{doctor.name}</strong>
                            <span>{t('patientCount', { value: doctor.count })}</span>
                            <b>
                              {Math.round((doctor.count / queueEntries.length) * 100)}%
                            </b>
                          </div>
                          <div className="dashboard-doctor-track">
                            <span
                              style={{
                                width: `${(doctor.count / queueEntries.length) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="dashboard-empty">{t('noQueue')}</p>
                  ))}
                {queue.isError && <p className="state error">{t('queueError')}</p>}
                {queue.isLoading && <p className="state">{t('loadingQueue')}</p>}
              </section>
            </div>
          )}

          <div className="dashboard-detail-grid">
            {(canViewQueue || canViewVisits || canViewFollowUps) && (
              <section className="dashboard-card">
                <DashboardPanelHeading
                  subtitle={t('operationalPriority')}
                  title={t('needsAttention')}
                />
                <div className="dashboard-attention-list">
                  {canViewQueue && (
                    <Link to="/queue">
                      <span className="dashboard-attention-dot" aria-hidden="true" />
                      <span>
                        <strong>{t('currentQueue')}</strong>
                        <small>{t('patientCount', { value: data.activeQueue })}</small>
                      </span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  )}
                  {canViewVisits && (
                    <Link to="/pending-documentation">
                      <span className="dashboard-attention-dot" aria-hidden="true" />
                      <span>
                        <strong>{t('documentationToFinish')}</strong>
                        <small>
                          {t('pendingVisitCount', { value: data.pendingDocumentation })}
                        </small>
                      </span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  )}
                  {canViewFollowUps && (
                    <Link to="/follow-ups">
                      <span className="dashboard-attention-dot" aria-hidden="true" />
                      <span>
                        <strong>{t('followUpsPastDue')}</strong>
                        <small>
                          {t('overdueCount', { value: data.overdueFollowUps })}
                        </small>
                      </span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </section>
            )}
            <section className="dashboard-card">
              <DashboardPanelHeading
                subtitle={t('commonActions')}
                title={t('quickActions')}
              />
              <div className="dashboard-quick-actions">
                {canViewPatients && (
                  <Link to="/patients">
                    <Users size={17} aria-hidden="true" /> {t('patients')}
                  </Link>
                )}
                {canViewQueue && (
                  <Link to="/queue">
                    <Activity size={17} aria-hidden="true" /> {t('liveQueue')}
                  </Link>
                )}
                {canViewVisits && (
                  <Link to="/pending-documentation">
                    <FileText size={17} aria-hidden="true" /> {t('pendingDocumentation')}
                  </Link>
                )}
                <Link to="/reports">
                  <ArrowUpRight size={17} aria-hidden="true" /> {t('reports')}
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  )
}
