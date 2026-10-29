import './reporting.css'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  CalendarDays,
  CircleCheck,
  Clock3,
  FileClock,
  ListFilter,
  UsersRound,
  UserRound,
} from 'lucide-react'
import { KpiCard } from '../../components/ui/KpiCard'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState({
    fromDate: '',
    toDate: '',
    doctorId: '',
    visitStatus: '',
    documentationStatus: '',
  })
  const filterCount = [
    fromDate,
    toDate,
    doctorId,
    visitStatus,
    documentationStatus,
  ].filter(Boolean).length
  const invalidDateRange = Boolean(
    draftFilters.fromDate &&
    draftFilters.toDate &&
    draftFilters.fromDate > draftFilters.toDate,
  )

  function clearFilters() {
    setFromDate('')
    setToDate('')
    setDoctorId('')
    setVisitStatus('')
    setDocumentationStatus('')
    setDraftFilters({
      fromDate: '',
      toDate: '',
      doctorId: '',
      visitStatus: '',
      documentationStatus: '',
    })
  }

  function applyFilters() {
    setFromDate(draftFilters.fromDate)
    setToDate(draftFilters.toDate)
    setDoctorId(draftFilters.doctorId)
    setVisitStatus(draftFilters.visitStatus)
    setDocumentationStatus(draftFilters.documentationStatus)
    setFiltersOpen(false)
  }

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
      </section>

      {dashboardQuery.isLoading && <p className="state">{t('loadingDashboard')}</p>}
      {dashboardQuery.isError && <p className="state error">{t('dashboardError')}</p>}

      {dashboard && (
        <>
          <div className="dashboard-date">
            {t('localDate')} <strong>{dashboard.localDate}</strong>
          </div>
          <section className="reporting-kpis">
            <KpiCard
              label={t('totalPatients')}
              value={dashboard.totalPatients}
              icon={UsersRound}
              tone="blue"
            />
            <KpiCard
              label={t('visitsToday')}
              value={dashboard.visitsToday}
              icon={Activity}
              tone="violet"
            />
            <KpiCard
              label={t('activeQueue')}
              value={dashboard.activeQueue}
              icon={UserRound}
              tone="teal"
            />
            <KpiCard
              label={t('completedToday')}
              value={dashboard.completedVisitsToday}
              icon={CircleCheck}
              tone="teal"
            />
            <KpiCard
              label={t('pendingDocumentation')}
              value={dashboard.pendingDocumentation}
              icon={FileClock}
              tone="amber"
            />
            <KpiCard
              label={t('followUpsToday')}
              value={dashboard.followUpsToday}
              icon={CalendarDays}
              tone="blue"
            />
            <KpiCard
              label={t('overdueFollowUps')}
              value={dashboard.overdueFollowUps}
              icon={Clock3}
              tone="amber"
            />
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
        <div className="report-filter-toolbar">
          {filterCount > 0 && (
            <button className="button secondary" type="button" onClick={clearFilters}>
              {t('clearFilters')}
            </button>
          )}
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setDraftFilters({
                fromDate,
                toDate,
                doctorId,
                visitStatus,
                documentationStatus,
              })
              setFiltersOpen(true)
            }}
          >
            <ListFilter size={16} aria-hidden="true" />
            {t('filters')}
            {filterCount > 0 ? ` (${filterCount})` : ''}
          </button>
        </div>
        <Dialog
          header={t('filters')}
          visible={filtersOpen}
          onHide={() => setFiltersOpen(false)}
          className="report-filter-dialog"
          modal
          dismissableMask
        >
          <div className="report-filters">
            <label>
              <span>{t('fromDate')}</span>
              <InputText
                type="date"
                className="auran-prime-field"
                value={draftFilters.fromDate}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    fromDate: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>{t('toDate')}</span>
              <InputText
                type="date"
                className="auran-prime-field"
                value={draftFilters.toDate}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    toDate: event.target.value,
                  }))
                }
              />
            </label>

            {auth.hasPermission('Users_View') && (
              <label>
                <span>{t('doctor')}</span>
                <Dropdown
                  className="auran-prime-field"
                  panelClassName="auran-prime-panel"
                  value={draftFilters.doctorId}
                  options={[
                    { label: t('allDoctors'), value: '' },
                    ...(employeesQuery.data ?? [])
                      .filter((employee) => employee.roles.includes('DOCTOR'))
                      .map((doctor) => ({ label: doctor.fullName, value: doctor.id })),
                  ]}
                  optionLabel="label"
                  optionValue="value"
                  filter
                  onChange={(event) =>
                    setDraftFilters((current) => ({ ...current, doctorId: event.value }))
                  }
                />
              </label>
            )}

            <label>
              <span>{t('visitStatus')}</span>
              <Dropdown
                className="auran-prime-field"
                panelClassName="auran-prime-panel"
                value={draftFilters.visitStatus}
                options={(['', 'Open', 'Completed', 'Cancelled'] as const).map(
                  (value) => ({
                    label: value ? t(value) : t('allStatuses'),
                    value,
                  }),
                )}
                optionLabel="label"
                optionValue="value"
                filter
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, visitStatus: event.value }))
                }
              />
            </label>

            <label>
              <span>{t('documentation')}</span>
              <Dropdown
                className="auran-prime-field"
                panelClassName="auran-prime-panel"
                value={draftFilters.documentationStatus}
                options={(
                  ['', 'NotStarted', 'Draft', 'Pending', 'Completed'] as const
                ).map((value) => ({
                  label: value ? t(value) : t('allStatuses'),
                  value,
                }))}
                optionLabel="label"
                optionValue="value"
                filter
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    documentationStatus: event.value,
                  }))
                }
              />
            </label>

            <div className="actions report-filter-actions">
              {invalidDateRange && (
                <p className="field-error" role="alert">
                  {t('dateRangeError')}
                </p>
              )}
              <button className="button secondary" type="button" onClick={clearFilters}>
                {t('clearFilters')}
              </button>
              <button
                className="button primary"
                type="button"
                onClick={applyFilters}
                disabled={invalidDateRange}
              >
                {t('applyFilters')}
              </button>
            </div>
          </div>
        </Dialog>

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
