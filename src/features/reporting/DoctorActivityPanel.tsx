import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../auth/AuthContext'
import { getEmployees } from '../employees/api'
import { exportDoctorActivityCsv, getDoctorActivity } from './doctorActivityApi'
import type { DoctorActivityQuery } from './doctorActivityTypes'
import { reportErrorMessage } from './reportErrors'
import { ReportFilterDialog } from './ReportFilterDialog'
import { useReportFilters } from './useReportFilters'

const emptyFilters = { fromDate: '', toDate: '', doctorId: '' }

export function DoctorActivityPanel() {
  const { t } = useTranslation('reporting')
  const auth = useAuth()
  const canView = auth.hasPermission('Reports_View')
  const canExport = canView && auth.hasPermission('Reports_Export')
  const filterState = useReportFilters(emptyFilters)
  const { applied, draft } = filterState
  const invalidDraftRange = Boolean(
    draft.fromDate && draft.toDate && draft.fromDate > draft.toDate,
  )
  const filterCount = Object.values(applied).filter(Boolean).length
  const filters = useMemo<DoctorActivityQuery>(
    () => ({
      fromDate: applied.fromDate || undefined,
      toDate: applied.toDate || undefined,
      doctorId: applied.doctorId || undefined,
    }),
    [applied],
  )

  const report = useQuery({
    queryKey: ['doctor-activity-report', filters],
    queryFn: () => getDoctorActivity(filters),
    enabled: canView,
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
            disabled={csv.isPending || report.isError || !report.data}
            onClick={() => csv.mutate(filters)}
          >
            {csv.isPending ? t('preparingCsv') : t('exportDoctors')}
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
        error={invalidDraftRange ? t('activityDateError') : undefined}
      >
        <label>
          <span>{t('activityFrom')}</span>
          <InputText
            type="date"
            className="auran-prime-field"
            value={draft.fromDate}
            onChange={(event) => filterState.update('fromDate', event.target.value)}
          />
        </label>
        <label>
          <span>{t('activityTo')}</span>
          <InputText
            type="date"
            className="auran-prime-field"
            value={draft.toDate}
            onChange={(event) => filterState.update('toDate', event.target.value)}
          />
        </label>
        {auth.hasPermission('Users_View') && (
          <label>
            <span>{t('activityDoctor')}</span>
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
      </ReportFilterDialog>
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
      {report.data && (
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
