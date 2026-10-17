import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getEmployees } from '../employees/api'
import { exportDoctorActivityCsv, getDoctorActivity } from './doctorActivityApi'
import type { DoctorActivityQuery } from './doctorActivityTypes'
import { reportErrorMessage } from './reportErrors'

export function DoctorActivityPanel() {
  const auth = useAuth()
  const canView = auth.hasPermission('Reports_View')
  const canExport = canView && auth.hasPermission('Reports_Export')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const validRange = !fromDate || !toDate || fromDate <= toDate
  const filters = useMemo<DoctorActivityQuery>(() => ({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    doctorId: doctorId || undefined,
  }), [fromDate, toDate, doctorId])

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
          <h2>Doctor activity report</h2>
          <p className="muted">Visit and documentation counts for the selected clinic-local dates. Current queue is live, not historical.</p>
        </div>
        {canExport && (
          <button className="button secondary" type="button"
            disabled={!validRange || csv.isPending || report.isError || !report.data}
            onClick={() => csv.mutate(filters)}>
            {csv.isPending ? 'Preparing CSV…' : 'Export doctor CSV'}
          </button>
        )}
      </div>
      <div className="report-filters">
        <label><span>Activity from</span><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
        <label><span>Activity to</span><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></label>
        {auth.hasPermission('Users_View') && (
          <label><span>Activity doctor</span><select value={doctorId} onChange={e => setDoctorId(e.target.value)}>
            <option value="">All doctors</option>
            {(employees.data ?? []).filter(employee => employee.roles.includes('DOCTOR')).map(doctor =>
              <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}
          </select></label>
        )}
        <div className="actions report-filter-actions">
          <button type="button" className="button secondary" onClick={() => {
            setFromDate(''); setToDate(''); setDoctorId('')
          }}>Clear activity filters</button>
        </div>
      </div>
      {!validRange && <p role="alert" className="field-error">Activity from must be on or before activity to.</p>}
      {report.isLoading && <p className="state" role="status">Loading doctor activity…</p>}
      {report.isError && <p role="alert" className="state error">{reportErrorMessage(report.error, 'Unable to load doctor activity.')}</p>}
      {csv.isError && <p role="alert" className="field-error">{reportErrorMessage(csv.error, 'Unable to export doctor activity.')}</p>}
      {validRange && report.data && (
        <>
          <p className="muted report-count">{report.data.totalCount} doctors</p>
          {report.data.rows.length === 0 ? <p className="state">No doctors match these filters.</p> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Doctor</th><th>Current queue</th><th>Total visits</th><th>Completed docs</th><th>Pending docs</th></tr></thead>
              <tbody>{report.data.rows.map(row => <tr key={row.doctorId}>
                <td>{row.doctorName}</td><td>{row.currentQueue}</td><td>{row.totalVisits}</td>
                <td>{row.completedDocs}</td><td>{row.pendingDocs}</td>
              </tr>)}</tbody>
            </table></div>
          )}
        </>
      )}
    </section>
  )
}
