import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../auth/AuthContext'
import { getEmployees } from '../employees/api'
import { exportQueueReportCsv, getQueueReport } from './queueReportApi'
import type { QueueReportQuery } from './queueReportTypes'
import { reportErrorMessage } from './reportErrors'
import { ReportFilterDialog } from './ReportFilterDialog'
import { useReportFilters } from './useReportFilters'

const emptyFilters = {
  fromDate: '',
  toDate: '',
  doctorId: '',
  workflowStatusId: '',
  selectedStatusName: '',
}

export function QueueReportPanel() {
  const { t } = useTranslation('reporting')
  const auth = useAuth()
  const canView = auth.hasPermission('Reports_View')
  const canExport = canView && auth.hasPermission('Reports_Export')
  const filterState = useReportFilters(emptyFilters)
  const { applied, draft } = filterState
  const invalidDraftRange = Boolean(
    draft.fromDate && draft.toDate && draft.fromDate > draft.toDate,
  )
  const filterCount = [
    applied.fromDate,
    applied.toDate,
    applied.doctorId,
    applied.workflowStatusId,
  ].filter(Boolean).length
  const filters = useMemo<QueueReportQuery>(
    () => ({
      fromDate: applied.fromDate || undefined,
      toDate: applied.toDate || undefined,
      doctorId: applied.doctorId || undefined,
      workflowStatusId: applied.workflowStatusId || undefined,
    }),
    [applied],
  )
  const preview = useQuery({
    queryKey: ['queue-report', filters],
    queryFn: () => getQueueReport(filters),
    enabled: canView,
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
            disabled={preview.isError || !preview.data || download.isPending}
            onClick={() => download.mutate(filters)}
          >
            {download.isPending ? t('preparingCsv') : t('exportQueue')}
          </button>
        )}
      </div>
      <ReportFilterDialog
        count={filterCount}
        open={filterState.open}
        onOpen={filterState.openDialog}
        onHide={() => filterState.setOpen(false)}
        onApply={filterState.apply}
        onClear={filterState.clear}
        error={invalidDraftRange ? t('queueDateError') : undefined}
      >
        <label>
          <span>{t('queueFrom')}</span>
          <InputText
            type="date"
            className="auran-prime-field"
            value={draft.fromDate}
            onChange={(event) => filterState.update('fromDate', event.target.value)}
          />
        </label>
        <label>
          <span>{t('queueTo')}</span>
          <InputText
            type="date"
            className="auran-prime-field"
            value={draft.toDate}
            onChange={(event) => filterState.update('toDate', event.target.value)}
          />
        </label>
        {auth.hasPermission('Users_View') && (
          <label>
            <span>{t('queueDoctor')}</span>
            <Dropdown
              className="auran-prime-field"
              panelClassName="auran-prime-panel"
              value={draft.doctorId}
              options={[
                { label: t('allDoctors'), value: '' },
                ...(employees.data ?? [])
                  .filter((employee) => employee.roles.includes('DOCTOR'))
                  .map((doctor) => ({ label: doctor.fullName, value: doctor.id })),
              ]}
              optionLabel="label"
              optionValue="value"
              filter
              onChange={(event) => filterState.update('doctorId', event.value)}
            />
          </label>
        )}
        <label>
          <span>{t('workflowStatus')}</span>
          <Dropdown
            className="auran-prime-field"
            panelClassName="auran-prime-panel"
            value={draft.workflowStatusId}
            options={[
              { label: t('allStatuses'), value: '' },
              ...(draft.workflowStatusId &&
              !statuses.some((status) => status.id === draft.workflowStatusId)
                ? [
                    {
                      label: draft.selectedStatusName,
                      value: draft.workflowStatusId,
                    },
                  ]
                : []),
              ...statuses.map((status) => ({ label: status.name, value: status.id })),
            ]}
            optionLabel="label"
            optionValue="value"
            filter
            onChange={(event) => {
              const id = event.value as string
              filterState.update('workflowStatusId', id)
              filterState.update(
                'selectedStatusName',
                statuses.find((status) => status.id === id)?.name ?? '',
              )
            }}
          />
        </label>
      </ReportFilterDialog>
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
      {preview.data && (
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
