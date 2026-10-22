import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { getEmployees } from '../employees/api'
import { exportQueueReportCsv, getQueueReport } from './queueReportApi'
import type { QueueReportQuery } from './queueReportTypes'
import { reportErrorMessage } from './reportErrors'

export function QueueReportPanel() {
  const { t } = useTranslation('reporting')
  const auth = useAuth()
  const canView = auth.hasPermission('Reports_View')
  const canExport = canView && auth.hasPermission('Reports_Export')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [workflowStatusId, setWorkflowStatusId] = useState('')
  const [selectedStatusName, setSelectedStatusName] = useState('')
  const validRange = !fromDate || !toDate || fromDate <= toDate
  const filters = useMemo<QueueReportQuery>(
    () => ({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      doctorId: doctorId || undefined,
      workflowStatusId: workflowStatusId || undefined,
    }),
    [fromDate, toDate, doctorId, workflowStatusId],
  )
  const preview = useQuery({
    queryKey: ['queue-report', filters],
    queryFn: () => getQueueReport(filters),
    enabled: canView && validRange,
  })
  const employees = useQuery({
    queryKey: ['employees', 'queue-report'],
    queryFn: getEmployees,
    enabled: canView && auth.hasPermission('Users_View'),
  })
  const download = useMutation({ mutationFn: exportQueueReportCsv })
  // Workflow status options originate from the same clinic-scoped queue report.
  // IDs are sent to the API, never arbitrary status labels.
  const statuses = useMemo(() => {
    const unique = new Map<string, string>()
    for (const row of preview.data?.rows ?? [])
      unique.set(row.workflowStatusId, row.workflowStatusName)
    return [...unique].map(([id, name]) => ({ id, name }))
  }, [preview.data])

  if (!canView) return null
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t('queueReport')}</h2>
          <p className="muted">{t('queueReportSubtitle')}</p>
        </div>
        {canExport && (
          <button
            className="button secondary"
            type="button"
            disabled={
              !validRange || preview.isError || !preview.data || download.isPending
            }
            onClick={() => download.mutate(filters)}
          >
            {download.isPending ? t('preparingCsv') : t('exportQueue')}
          </button>
        )}
      </div>
      <div className="report-filters">
        <label>
          <span>{t('queueFrom')}</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          <span>{t('queueTo')}</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        {auth.hasPermission('Users_View') && (
          <label>
            <span>{t('queueDoctor')}</span>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">{t('allDoctors')}</option>
              {(employees.data ?? [])
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
          <span>{t('workflowStatus')}</span>
          <select
            value={workflowStatusId}
            onChange={(e) => {
              setWorkflowStatusId(e.target.value)
              setSelectedStatusName(e.target.selectedOptions[0]?.textContent ?? '')
            }}
          >
            <option value="">{t('allStatuses')}</option>
            {workflowStatusId &&
              !statuses.some((status) => status.id === workflowStatusId) && (
                <option value={workflowStatusId}>{selectedStatusName}</option>
              )}
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </label>
        <div className="actions report-filter-actions">
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setFromDate('')
              setToDate('')
              setDoctorId('')
              setWorkflowStatusId('')
              setSelectedStatusName('')
            }}
          >
            {t('clearQueue')}
          </button>
        </div>
      </div>
      {!validRange && (
        <p role="alert" className="field-error">
          {t('queueDateError')}
        </p>
      )}
      {preview.isLoading && (
        <p role="status" className="state">
          {t('loadingQueue')}
        </p>
      )}
      {preview.isError && (
        <p role="alert" className="state error">
          {reportErrorMessage(preview.error, t('queueError'))}
        </p>
      )}
      {download.isError && (
        <p role="alert" className="field-error">
          {reportErrorMessage(download.error, t('queueExportError'))}
        </p>
      )}
      {validRange && preview.data && (
        <>
          <p className="muted report-count">
            {t('queueCount', { count: preview.data.totalCount })}
          </p>
          {preview.data.rows.length === 0 ? (
            <p className="state">{t('noQueue')}</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('patient')}</th>
                    <th>{t('doctor')}</th>
                    <th>{t('workflow')}</th>
                    <th>{t('entryUtc')}</th>
                    <th>{t('exitUtc')}</th>
                    <th>{t('clinicMinutes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.data.rows.map((row) => (
                    <tr key={row.queueEntryId}>
                      <td>
                        <Link className="patient-link" to={`/patients/${row.patientId}`}>
                          {row.patientName}
                        </Link>
                        <div className="muted mono">{row.patientNumber}</div>
                      </td>
                      <td>{row.doctorName ?? '—'}</td>
                      <td>{row.workflowStatusName}</td>
                      <td>
                        {new Date(row.entryAtUtc)
                          .toISOString()
                          .replace('T', ' ')
                          .slice(0, 16)}
                      </td>
                      <td>
                        {row.exitAtUtc
                          ? new Date(row.exitAtUtc)
                              .toISOString()
                              .replace('T', ' ')
                              .slice(0, 16)
                          : t('active')}
                      </td>
                      <td>
                        {row.durationMinutes == null
                          ? '—'
                          : row.durationMinutes.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
