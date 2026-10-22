import './reporting.css'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { getEmployees } from '../employees/api'
import {
  exportVisitReport,
  exportVisitReportXlsx,
  getDashboardSummary,
  getVisitReport,
} from './api'
import type { VisitReportQuery } from './types'
import { reportErrorMessage } from './reportErrors'
import { PatientReportPanel } from './PatientReportPanel'
import { QueueReportPanel } from './QueueReportPanel'
import { DoctorActivityPanel } from './DoctorActivityPanel'

export function ReportingPage() {
  const { t, i18n } = useTranslation('reporting')
  const auth = useAuth()
  const canView = auth.hasPermission('Reports_View')
  const canExport = auth.hasPermission('Reports_Export')

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [visitStatus, setVisitStatus] = useState('')
  const [documentationStatus, setDocumentationStatus] = useState('')

  const reportQueryParams = useMemo<VisitReportQuery>(
    () => ({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      doctorId: doctorId || undefined,
      visitStatus: visitStatus || undefined,
      documentationStatus: documentationStatus || undefined,
    }),
    [fromDate, toDate, doctorId, visitStatus, documentationStatus],
  )

  const xlsxExport = useMutation({ mutationFn: exportVisitReportXlsx })
  const csvExport = useMutation({ mutationFn: exportVisitReport })

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
        <p className="state error">{t('forbidden')}</p>
      </main>
    )
  }

  const dashboard = dashboardQuery.data

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t('title')}</h1>
          <p className="muted">{t('subtitle')}</p>
        </div>
        <div className="actions">
          {auth.hasPermission('Audit_View') && (
            <Link className="button secondary nav-button" to="/audit">
              {t('audit')}
            </Link>
          )}
          {auth.hasPermission('Settings_View') && (
            <Link className="button secondary nav-button" to="/settings">
              {t('settings')}
            </Link>
          )}
          <Link className="button secondary nav-button" to="/follow-ups">
            {t('followUps')}
          </Link>
          <Link className="button secondary nav-button" to="/queue">
            {t('liveQueue')}
          </Link>
          <Link className="button secondary nav-button" to="/patients">
            {t('patients')}
          </Link>
        </div>
      </section>

      {dashboardQuery.isLoading && <p className="state">{t('loadingDashboard')}</p>}
      {dashboardQuery.isError && <p className="state error">{t('dashboardError')}</p>}

      {dashboard && (
        <>
          <div className="dashboard-date">
            {t('localDate')} <strong>{dashboard.localDate}</strong>
          </div>
          <section className="kpi-grid">
            <article className="kpi-card">
              <span>{t('totalPatients')}</span>
              <strong>{dashboard.totalPatients}</strong>
            </article>
            <article className="kpi-card">
              <span>{t('visitsToday')}</span>
              <strong>{dashboard.visitsToday}</strong>
            </article>
            <article className="kpi-card">
              <span>{t('activeQueue')}</span>
              <strong>{dashboard.activeQueue}</strong>
            </article>
            <article className="kpi-card">
              <span>{t('completedToday')}</span>
              <strong>{dashboard.completedVisitsToday}</strong>
            </article>
            <article className="kpi-card">
              <span>{t('pendingDocumentation')}</span>
              <strong>{dashboard.pendingDocumentation}</strong>
            </article>
            <article className="kpi-card">
              <span>{t('followUpsToday')}</span>
              <strong>{dashboard.followUpsToday}</strong>
            </article>
            <article className="kpi-card kpi-attention">
              <span>{t('overdueFollowUps')}</span>
              <strong>{dashboard.overdueFollowUps}</strong>
            </article>
          </section>
        </>
      )}

      <section className="panel print-report">
        <div className="panel-heading">
          <div>
            <h2>{t('visitReport')}</h2>
            <p className="muted">{t('visitReportSubtitle')}</p>
          </div>
          {canExport && (
            <div className="actions print-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => window.print()}
                disabled={!reportQuery.data || reportQuery.isFetching}
              >
                {t('printPdf')}
              </button>
              <button
                className="button secondary"
                type="button"
                disabled={csvExport.isPending}
                onClick={() => csvExport.mutate(reportQueryParams)}
              >
                {csvExport.isPending ? t('preparingCsv') : t('exportCsv')}
              </button>
              <button
                className="button secondary"
                type="button"
                disabled={xlsxExport.isPending}
                onClick={() => xlsxExport.mutate(reportQueryParams)}
              >
                {xlsxExport.isPending ? t('preparingExcel') : t('exportExcel')}
              </button>
            </div>
          )}
        </div>

        {xlsxExport.isError && (
          <p role="alert" className="field-error">
            {reportErrorMessage(xlsxExport.error, t('excelError'))}
          </p>
        )}
        {csvExport.isError && (
          <p role="alert" className="field-error">
            {reportErrorMessage(csvExport.error, t('csvError'))}
          </p>
        )}
        <div className="report-filters">
          <label>
            <span>{t('fromDate')}</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
          <label>
            <span>{t('toDate')}</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>

          {auth.hasPermission('Users_View') && (
            <label>
              <span>{t('doctor')}</span>
              <select
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
              >
                <option value="">{t('allDoctors')}</option>
                {(employeesQuery.data ?? [])
                  .filter((employee) => employee.roles.includes('DOCTOR'))
                  .map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.fullName}
                    </option>
                  ))}
              </select>
            </label>
          )}

          <label>
            <span>{t('visitStatus')}</span>
            <select
              value={visitStatus}
              onChange={(event) => setVisitStatus(event.target.value)}
            >
              <option value="">{t('allStatuses')}</option>
              <option value="Open">{t('Open')}</option>
              <option value="Completed">{t('Completed')}</option>
              <option value="Cancelled">{t('Cancelled')}</option>
            </select>
          </label>

          <label>
            <span>{t('documentation')}</span>
            <select
              value={documentationStatus}
              onChange={(event) => setDocumentationStatus(event.target.value)}
            >
              <option value="">{t('allStatuses')}</option>
              <option value="NotStarted">{t('NotStarted')}</option>
              <option value="Draft">{t('Draft')}</option>
              <option value="Pending">{t('Pending')}</option>
              <option value="Completed">{t('Completed')}</option>
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
              {t('clearFilters')}
            </button>
          </div>
        </div>

        {reportQuery.isLoading && <p className="state">{t('loadingReport')}</p>}
        {reportQuery.isError && (
          <p className="state error">
            {reportErrorMessage(reportQuery.error, t('reportError'))}
          </p>
        )}

        {reportQuery.data && (
          <>
            <p className="report-print-context">
              {t('filterContext', {
                from: fromDate || t('any'),
                to: toDate || t('any'),
                visitStatus: visitStatus
                  ? t(visitStatus, { defaultValue: visitStatus })
                  : t('any'),
                documentation: documentationStatus
                  ? t(documentationStatus, { defaultValue: documentationStatus })
                  : t('any'),
              })}
            </p>
            <p className="muted report-count">
              {t('visitCount', { count: reportQuery.data.totalCount })}
            </p>

            {reportQuery.data.rows.length === 0 ? (
              <p className="state">{t('noVisits')}</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t('patient')}</th>
                      <th>{t('doctor')}</th>
                      <th>{t('visit')}</th>
                      <th>{t('documentation')}</th>
                      <th>{t('entry')}</th>
                      <th>{t('diagnosis')}</th>
                      <th>{t('treatmentPlan')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportQuery.data.rows.map((row) => (
                      <tr key={row.visitId}>
                        <td>
                          <Link
                            className="patient-link"
                            to={`/patients/${row.patientId}`}
                          >
                            <strong>{row.patientName}</strong>
                          </Link>
                          <div className="muted mono">{row.patientNumber}</div>
                        </td>
                        <td>{row.doctorName}</td>
                        <td>{t(row.visitStatus, { defaultValue: row.visitStatus })}</td>
                        <td>
                          {t(row.documentationStatus, {
                            defaultValue: row.documentationStatus,
                          })}
                        </td>
                        <td>{new Date(row.entryAtUtc).toLocaleString(i18n.language)}</td>
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
      <PatientReportPanel />
      <QueueReportPanel />
      <DoctorActivityPanel />
    </main>
  )
}
