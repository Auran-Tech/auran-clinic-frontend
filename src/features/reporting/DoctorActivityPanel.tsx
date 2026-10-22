import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { getEmployees } from '../employees/api'
import { exportDoctorActivityCsv, getDoctorActivity } from './doctorActivityApi'
import type { DoctorActivityQuery } from './doctorActivityTypes'
import { reportErrorMessage } from './reportErrors'

export function DoctorActivityPanel() {
  const { t } = useTranslation('reporting')
  const auth = useAuth()
  const canView = auth.hasPermission('Reports_View')
  const canExport = canView && auth.hasPermission('Reports_Export')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const validRange = !fromDate || !toDate || fromDate <= toDate
  const filters = useMemo<DoctorActivityQuery>(
    () => ({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      doctorId: doctorId || undefined,
    }),
    [fromDate, toDate, doctorId],
  )

  const report = useQuery({
    queryKey: ['doctor-activity-report', filters],
    queryFn: () => getDoctorActivity(filters),
    enabled: canView && validRange,
  })
  const employees = useQuery({
    queryKey: ['employees', 'doctor-activity-report'],
    queryFn: getEmployees,
    enabled: canView && auth.hasPermission('Users_View'),
  })
  const csv = useMutation({ mutationFn: exportDoctorActivityCsv })

  if (!canView) return null

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t('doctorActivity')}</h2>
          <p className="muted">{t('doctorActivitySubtitle')}</p>
        </div>
        {canExport && (
          <button
            className="button secondary"
            type="button"
            disabled={!validRange || csv.isPending || report.isError || !report.data}
            onClick={() => csv.mutate(filters)}
          >
            {csv.isPending ? t('preparingCsv') : t('exportDoctors')}
          </button>
        )}
      </div>
      <div className="report-filters">
        <label>
          <span>{t('activityFrom')}</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          <span>{t('activityTo')}</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        {auth.hasPermission('Users_View') && (
          <label>
            <span>{t('activityDoctor')}</span>
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
        <div className="actions report-filter-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setFromDate('')
              setToDate('')
              setDoctorId('')
            }}
          >
            {t('clearActivity')}
          </button>
        </div>
      </div>
      {!validRange && (
        <p role="alert" className="field-error">
          {t('activityDateError')}
        </p>
      )}
      {report.isLoading && (
        <p className="state" role="status">
          {t('loadingActivity')}
        </p>
      )}
      {report.isError && (
        <p role="alert" className="state error">
          {reportErrorMessage(report.error, t('activityError'))}
        </p>
      )}
      {csv.isError && (
        <p role="alert" className="field-error">
          {reportErrorMessage(csv.error, t('activityExportError'))}
        </p>
      )}
      {validRange && report.data && (
        <>
          <p className="muted report-count">
            {t('doctorCount', { count: report.data.totalCount })}
          </p>
          {report.data.rows.length === 0 ? (
            <p className="state">{t('noDoctors')}</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('doctor')}</th>
                    <th>{t('currentQueue')}</th>
                    <th>{t('totalVisits')}</th>
                    <th>{t('completedDocs')}</th>
                    <th>{t('pendingDocs')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.data.rows.map((row) => (
                    <tr key={row.doctorId}>
                      <td>{row.doctorName}</td>
                      <td>{row.currentQueue}</td>
                      <td>{row.totalVisits}</td>
                      <td>{row.completedDocs}</td>
                      <td>{row.pendingDocs}</td>
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
