import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getEmployees } from '../employees/api'
import {
  export{t('common.visit')}Report,
  getDashboardSummary,
  get{t('common.visit')}Report,
} from './api'
import type { {t('common.visit')}ReportQuery } from './types'

export function ReportingPage() {
  const auth = useAuth()
  const { t } = useTranslation()
  const canView = auth.hasPermission('Reports_View')
  const canExport = auth.hasPermission('Reports_Export')

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [doctorId, set{t('common.doctor')}Id] = useState('')
  const [visitStatus, set{t('common.visit')}Status] = useState('')
  const [documentationStatus, set{t('common.documentation')}Status] = useState('')

  const reportQueryParams = useMemo<{t('common.visit')}ReportQuery>(() => ({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    doctorId: doctorId || undefined,
    visitStatus: visitStatus || undefined,
    documentationStatus: documentationStatus || undefined,
  }), [fromDate, toDate, doctorId, visitStatus, documentationStatus])

  const dashboardQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    enabled: canView,
    refetchInterval: 60_000,
  })

  const employeesQuery = useQuery({
    queryKey: ['employees', 'report-filter'],
    queryFn: getEmployees,
    enabled: canView && auth.hasPermission('Users_View'),
  })

  const reportQuery = useQuery({
    queryKey: ['visit-report', reportQueryParams],
    queryFn: () => get{t('common.visit')}Report(reportQueryParams),
    enabled: canView,
  })

  if (!canView) {
    return (
      <main className="page-shell">
        <p className="state error">{t('reporting.denied')}</p>
      </main>
    )
  }

  const dashboard = dashboardQuery.data

  return (
    <main className="page-shell">
      <section className="page-header no-print">
        <div>
          <p className="eyebrow">{t('reporting.eyebrow')}</p>
          <h1>{t('reporting.title')}</h1>
          <p className="muted">
            {t('reporting.intro')}
          </p>
        </div>
        <div className="actions">
          <Link className="button secondary nav-button" to="/guide">{t('common.guide')}</Link>
          {auth.hasPermission('{t('common.audit')}_View') && (
            <Link className="button secondary nav-button" to="/audit">{t('common.audit')}</Link>
          )}
          {auth.hasPermission('{t('common.settings')}_View') && (
            <Link className="button secondary nav-button" to="/settings">{t('common.settings')}</Link>
          )}
          <Link className="button secondary nav-button" to="/follow-ups">{t('common.followUps')}</Link>
          <Link className="button secondary nav-button" to="/queue">{t('common.queue')}</Link>
          <Link className="button secondary nav-button" to="/patients">{t('common.patients')}</Link>
        </div>
      </section>

      {dashboardQuery.isLoading && <p className="state">{t('reporting.loadingDashboard')}</p>}
      {dashboardQuery.isError && <p className="state error">{t('reporting.dashboardError')}</p>}

      {dashboard && (
        <>
          <div className="dashboard-date">
            {t('reporting.clinicLocalDate')}: <strong>{dashboard.localDate}</strong>
          </div>
          <section className="kpi-grid">
            <article className="kpi-card">
              <span>{t('reporting.total{t('reporting.patient')}s')}</span>
              <strong>{dashboard.total{t('common.patients')}}</strong>
            </article>
            <article className="kpi-card">
              <span>{t('reporting.visitsToday')}</span>
              <strong>{dashboard.visitsToday}</strong>
            </article>
            <article className="kpi-card">
              <span>{t('reporting.activeQueue')}</span>
              <strong>{dashboard.activeQueue}</strong>
            </article>
            <article className="kpi-card">
              <span>{t('reporting.completedToday')}</span>
              <strong>{dashboard.completed{t('common.visit')}sToday}</strong>
            </article>
            <article className="kpi-card">
              <span>{t('reporting.pending{t('common.documentation')}')}</span>
              <strong>{dashboard.pending{t('common.documentation')}}</strong>
            </article>
            <article className="kpi-card">
              <span>{t('common.followUps')} today</span>
              <strong>{dashboard.followUpsToday}</strong>
            </article>
            <article className="kpi-card kpi-attention">
              <span>{t('reporting.overdueFollowUps')}</span>
              <strong>{dashboard.overdueFollowUps}</strong>
            </article>
          </section>
        </>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t('reporting.visitReport')}</h2>
            <p className="muted">
              {t('reporting.visitReportIntro')}
            </p>
          </div>
          <div className="actions report-export-actions">
            <button
              className="button secondary no-print"
              type="button"
              onClick={() => window.print()}
            >
              {t('reporting.printPdf')}
            </button>
            {canExport && (
              <button
                className="button secondary no-print"
                type="button"
                onClick={() => void export{t('common.visit')}Report(reportQueryParams)}
              >
                {t('reporting.exportCsv')}
              </button>
            )}
          </div>
        </div>

        <div className="report-filters no-print">
          <label>
            <span>{t('reporting.fromDate')}</span>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label>
            <span>{t('reporting.toDate')}</span>
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>

          {auth.hasPermission('Users_View') && (
            <label>
              <span>{t('common.doctor')}</span>
              <select value={doctorId} onChange={(event) => set{t('common.doctor')}Id(event.target.value)}>
                <option value="">{t('reporting.allDoctors')}</option>
                {(employeesQuery.data ?? [])
                  .filter((employee) => employee.roles.includes('DOCTOR'))
                  .map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
                  ))}
              </select>
            </label>
          )}

          <label>
            <span>{t('reporting.visitStatus')}</span>
            <select value={visitStatus} onChange={(event) => set{t('common.visit')}Status(event.target.value)}>
              <option value="">{t('reporting.allStatuses')}</option>
              <option value="{t('reporting.open')}">{t('reporting.open')}</option>
              <option value="{t('reporting.completed')}">{t('reporting.completed')}</option>
              <option value="{t('reporting.cancelled')}">{t('reporting.cancelled')}</option>
            </select>
          </label>

          <label>
            <span>{t('common.documentation')}</span>
            <select value={documentationStatus} onChange={(event) => set{t('common.documentation')}Status(event.target.value)}>
              <option value="">{t('reporting.allStatuses')}</option>
              <option value="NotStarted">{t('reporting.notStarted')}</option>
              <option value="{t('reporting.draft')}">{t('reporting.draft')}</option>
              <option value="{t('reporting.pending')}">{t('reporting.pending')}</option>
              <option value="{t('reporting.completed')}">{t('reporting.completed')}</option>
            </select>
          </label>

          <div className="actions report-filter-actions">
            <button
              className="button secondary"
              onClick={() => {
                setFromDate('')
                setToDate('')
                set{t('common.doctor')}Id('')
                set{t('common.visit')}Status('')
                set{t('common.documentation')}Status('')
              }}
            >
              {t('reporting.clearFilters')}
            </button>
          </div>
        </div>

        {reportQuery.isLoading && <p className="state">{t('reporting.loadingReport')}</p>}
        {reportQuery.isError && (
          <p className="state error">
            {t('reporting.reportError')}
          </p>
        )}

        {reportQuery.data && (
          <>
            <p className="muted report-count">
              {t('reporting.visitCount', { count: reportQuery.data.totalCount })}
            </p>

            {reportQuery.data.rows.length === 0 ? (
              <p className="state">{t('reporting.noMatches')}</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t('reporting.patient')}</th>
                      <th>{t('common.doctor')}</th>
                      <th>{t('common.visit')}</th>
                      <th>{t('common.documentation')}</th>
                      <th>{t('common.entry')}</th>
                      <th>{t('common.diagnosis')}</th>
                      <th>{t('common.treatmentPlan')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportQuery.data.rows.map((row) => (
                      <tr key={row.visitId}>
                        <td>
                          <Link className="patient-link" to={`/patients/${row.patientId}`}>
                            <strong>{row.patientName}</strong>
                          </Link>
                          <div className="muted mono">{row.patientNumber}</div>
                        </td>
                        <td>{row.doctorName}</td>
                        <td>{row.visitStatus}</td>
                        <td>{row.documentationStatus}</td>
                        <td>{new Date(row.entryAtUtc).toLocaleString()}</td>
                        <td className="report-text-cell">{row.diagnosis ?? '—'}</td>
                        <td className="report-text-cell">{row.treatmentPlan ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
