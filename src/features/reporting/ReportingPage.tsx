import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getEmployees } from '../employees/api'
import {
  exportVisitReport,
  getDashboardSummary,
  getVisitReport,
} from './api'
import type { VisitReportQuery } from './types'

export function ReportingPage() {
  const auth = useAuth()
  const canView = auth.hasPermission('Reports_View')
  const canExport = auth.hasPermission('Reports_Export')

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [visitStatus, setVisitStatus] = useState('')
  const [documentationStatus, setDocumentationStatus] = useState('')

  const reportQueryParams = useMemo<VisitReportQuery>(() => ({
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
    queryFn: () => getVisitReport(reportQueryParams),
    enabled: canView,
  })

  if (!canView) {
    return (
      <main className="page-shell">
        <p className="state error">You do not have permission to view reports.</p>
      </main>
    )
  }

  const dashboard = dashboardQuery.data

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Operations & intelligence</p>
          <h1>Dashboard & reports</h1>
          <p className="muted">
            Live clinic KPIs and filterable visit-level reporting.
          </p>
        </div>
        <div className="actions">
          {auth.hasPermission('Settings_View') && (
            <Link className="button secondary nav-button" to="/settings">Settings</Link>
          )}
          <Link className="button secondary nav-button" to="/follow-ups">Follow-ups</Link>
          <Link className="button secondary nav-button" to="/queue">Live queue</Link>
          <Link className="button secondary nav-button" to="/patients">Patients</Link>
        </div>
      </section>

      {dashboardQuery.isLoading && <p className="state">Loading dashboard…</p>}
      {dashboardQuery.isError && <p className="state error">Unable to load dashboard.</p>}

      {dashboard && (
        <>
          <div className="dashboard-date">
            Clinic local date: <strong>{dashboard.localDate}</strong>
          </div>
          <section className="kpi-grid">
            <article className="kpi-card">
              <span>Total patients</span>
              <strong>{dashboard.totalPatients}</strong>
            </article>
            <article className="kpi-card">
              <span>Visits today</span>
              <strong>{dashboard.visitsToday}</strong>
            </article>
            <article className="kpi-card">
              <span>Active queue</span>
              <strong>{dashboard.activeQueue}</strong>
            </article>
            <article className="kpi-card">
              <span>Completed today</span>
              <strong>{dashboard.completedVisitsToday}</strong>
            </article>
            <article className="kpi-card">
              <span>Pending documentation</span>
              <strong>{dashboard.pendingDocumentation}</strong>
            </article>
            <article className="kpi-card">
              <span>Follow-ups today</span>
              <strong>{dashboard.followUpsToday}</strong>
            </article>
            <article className="kpi-card kpi-attention">
              <span>Overdue follow-ups</span>
              <strong>{dashboard.overdueFollowUps}</strong>
            </article>
          </section>
        </>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Visit report</h2>
            <p className="muted">
              Filter visits by local date range, doctor, visit state, and documentation state.
            </p>
          </div>
          {canExport && (
            <button
              className="button secondary"
              onClick={() => void exportVisitReport(reportQueryParams)}
            >
              Export CSV
            </button>
          )}
        </div>

        <div className="report-filters">
          <label>
            <span>From date</span>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label>
            <span>To date</span>
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>

          {auth.hasPermission('Users_View') && (
            <label>
              <span>Doctor</span>
              <select value={doctorId} onChange={(event) => setDoctorId(event.target.value)}>
                <option value="">All doctors</option>
                {(employeesQuery.data ?? [])
                  .filter((employee) => employee.roles.includes('DOCTOR'))
                  .map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
                  ))}
              </select>
            </label>
          )}

          <label>
            <span>Visit status</span>
            <select value={visitStatus} onChange={(event) => setVisitStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="Open">Open</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>

          <label>
            <span>Documentation</span>
            <select value={documentationStatus} onChange={(event) => setDocumentationStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="NotStarted">Not started</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </label>

          <div className="actions report-filter-actions">
            <button
              className="button secondary"
              onClick={() => {
                setFromDate('')
                setToDate('')
                setDoctorId('')
                setVisitStatus('')
                setDocumentationStatus('')
              }}
            >
              Clear filters
            </button>
          </div>
        </div>

        {reportQuery.isLoading && <p className="state">Loading report…</p>}
        {reportQuery.isError && (
          <p className="state error">
            Unable to load report. Check the date range and filters.
          </p>
        )}

        {reportQuery.data && (
          <>
            <p className="muted report-count">
              {reportQuery.data.totalCount} visit{reportQuery.data.totalCount === 1 ? '' : 's'}
            </p>

            {reportQuery.data.rows.length === 0 ? (
              <p className="state">No visits match these filters.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Visit</th>
                      <th>Documentation</th>
                      <th>Entry</th>
                      <th>Diagnosis</th>
                      <th>Treatment plan</th>
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
