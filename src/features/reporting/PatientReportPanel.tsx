import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { exportPatientReportCsv, getPatientReport } from './patientReportApi'
import { reportErrorMessage } from './reportErrors'
import type { PatientReportQuery } from './patientReportTypes'

export function PatientReportPanel() {
  const { t, i18n } = useTranslation('reporting')
  const auth = useAuth()
  const canView = auth.hasPermission('Reports_View')
  const canExport = canView && auth.hasPermission('Reports_Export')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [gender, setGender] = useState('')
  const filters = useMemo<PatientReportQuery>(
    () => ({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      gender: gender.trim() || undefined,
    }),
    [fromDate, toDate, gender],
  )
  const validRange = !fromDate || !toDate || fromDate <= toDate

  const preview = useQuery({
    queryKey: ['patients-report', filters],
    queryFn: () => getPatientReport(filters),
    enabled: canView && validRange,
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
            disabled={
              !validRange || download.isPending || preview.isError || !preview.data
            }
            onClick={() => download.mutate(filters)}
          >
            {download.isPending ? t('preparingCsv') : t('exportPatients')}
          </button>
        )}
      </div>
      <div className="report-filters">
        <label>
          <span>{t('registeredFrom')}</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          <span>{t('registeredTo')}</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        <label>
          <span>{t('gender')}</span>
          <input
            maxLength={32}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            placeholder={t('allGenders')}
          />
        </label>
        <div className="actions report-filter-actions">
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setFromDate('')
              setToDate('')
              setGender('')
            }}
          >
            {t('clearFilters')}
          </button>
        </div>
      </div>
      {!validRange && (
        <p role="alert" className="field-error">
          {t('patientDateError')}
        </p>
      )}
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
      {validRange && preview.data && (
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
