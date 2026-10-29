import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../auth/AuthContext'
import { exportPatientReportCsv, getPatientReport } from './patientReportApi'
import { reportErrorMessage } from './reportErrors'
import type { PatientReportQuery } from './patientReportTypes'
import { ReportFilterDialog } from './ReportFilterDialog'
import { useReportFilters } from './useReportFilters'

const emptyFilters = { fromDate: '', toDate: '', gender: '' }

export function PatientReportPanel() {
  const { t, i18n } = useTranslation('reporting')
  const auth = useAuth()
  const canView = auth.hasPermission('Reports_View')
  const canExport = canView && auth.hasPermission('Reports_Export')
  const filterState = useReportFilters(emptyFilters)
  const { applied, draft } = filterState
  const filters = useMemo<PatientReportQuery>(
    () => ({
      fromDate: applied.fromDate || undefined,
      toDate: applied.toDate || undefined,
      gender: applied.gender || undefined,
    }),
    [applied],
  )
  const invalidDraftRange = Boolean(
    draft.fromDate && draft.toDate && draft.fromDate > draft.toDate,
  )
  const filterCount = Object.values(applied).filter(Boolean).length

  const preview = useQuery({
    queryKey: ['patients-report', filters],
    queryFn: () => getPatientReport(filters),
    enabled: canView,
  })
  const download = useMutation({ mutationFn: exportPatientReportCsv })

  if (!canView) return null

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t('patientsReport')}</h2>
          <p className="muted">{t('patientsReportSubtitle')}</p>
        </div>
        {canExport && (
          <button
            className="button secondary"
            type="button"
            disabled={download.isPending || preview.isError || !preview.data}
            onClick={() => download.mutate(filters)}
          >
            {download.isPending ? t('preparingCsv') : t('exportPatients')}
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
        error={invalidDraftRange ? t('patientDateError') : undefined}
      >
        <label>
          <span>{t('registeredFrom')}</span>
          <InputText
            type="date"
            className="auran-prime-field"
            value={draft.fromDate}
            onChange={(event) => filterState.update('fromDate', event.target.value)}
          />
        </label>
        <label>
          <span>{t('registeredTo')}</span>
          <InputText
            type="date"
            className="auran-prime-field"
            value={draft.toDate}
            onChange={(event) => filterState.update('toDate', event.target.value)}
          />
        </label>
        <label>
          <span>{t('gender')}</span>
          <Dropdown
            className="auran-prime-field"
            panelClassName="auran-prime-panel"
            value={draft.gender}
            options={[
              { label: t('allGenders'), value: '' },
              { label: t('female'), value: 'Female' },
              { label: t('male'), value: 'Male' },
              { label: t('unspecified'), value: 'Unspecified' },
            ]}
            optionLabel="label"
            optionValue="value"
            filter
            onChange={(event) => filterState.update('gender', event.value)}
          />
        </label>
      </ReportFilterDialog>
      {preview.isLoading && (
        <p role="status" className="state">
          {t('loadingPatients')}
        </p>
      )}
      {preview.isError && (
        <p role="alert" className="state error">
          {reportErrorMessage(preview.error, t('patientsError'))}
        </p>
      )}
      {download.isError && (
        <p role="alert" className="field-error">
          {reportErrorMessage(download.error, t('patientsExportError'))}
        </p>
      )}
      {preview.data && (
        <>
          <p className="muted report-count">
            {t('patientCount', { count: preview.data.totalCount })}
          </p>
          {preview.data.rows.length === 0 ? (
            <p className="state">{t('noPatients')}</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('number')}</th>
                    <th>{t('patient')}</th>
                    <th>{t('phone')}</th>
                    <th>{t('gender')}</th>
                    <th>{t('dateOfBirth')}</th>
                    <th>{t('registeredUtc')}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.data.rows.map((row) => (
                    <tr key={row.patientId}>
                      <td className="mono">{row.patientNumber}</td>
                      <td>
                        <Link className="patient-link" to={`/patients/${row.patientId}`}>
                          {row.patientName}
                        </Link>
                      </td>
                      <td>{row.phone}</td>
                      <td>{row.gender ?? '—'}</td>
                      <td>{row.dateOfBirth ?? '—'}</td>
                      <td>{new Date(row.createdAtUtc).toLocaleString(i18n.language)}</td>
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
