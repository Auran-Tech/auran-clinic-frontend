import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { exportPatientReportCsv, getPatientReport } from './patientReportApi'
import { reportErrorMessage } from './reportErrors'
import type { PatientReportQuery } from './patientReportTypes'

export function PatientReportPanel() {
  const auth = useAuth()
  const canView = auth.hasPermission('Reports_View')
  const canExport = canView && auth.hasPermission('Reports_Export')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [gender, setGender] = useState('')
  const filters = useMemo<PatientReportQuery>(() => ({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    gender: gender.trim() || undefined,
  }), [fromDate, toDate, gender])
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
          <h2>Patients report</h2>
          <p className="muted">Filter by registration date in clinic local time and gender.</p>
        </div>
        {canExport && (
          <button className="button secondary" type="button"
            disabled={!validRange || download.isPending || preview.isError || !preview.data}
            onClick={() => download.mutate(filters)}>
            {download.isPending ? 'Preparing CSV…' : 'Export patients CSV'}
          </button>
        )}
      </div>
      <div className="report-filters">
        <label><span>Registered from</span><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
        <label><span>Registered to</span><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></label>
        <label><span>Gender</span><input maxLength={32} value={gender} onChange={e => setGender(e.target.value)} placeholder="All genders" /></label>
        <div className="actions report-filter-actions"><button className="button secondary" type="button"
          onClick={() => { setFromDate(''); setToDate(''); setGender('') }}>Clear filters</button></div>
      </div>
      {!validRange && <p role="alert" className="field-error">Registered from must be on or before registered to.</p>}
      {preview.isLoading && <p role="status" className="state">Loading patients report…</p>}
      {preview.isError && <p role="alert" className="state error">{reportErrorMessage(preview.error, 'Unable to load patients report.')}</p>}
      {download.isError && <p role="alert" className="field-error">{reportErrorMessage(download.error, 'Unable to export patients report.')}</p>}
      {validRange && preview.data && (
        <>
          <p className="muted report-count">{preview.data.totalCount} patients</p>
          {preview.data.rows.length === 0
            ? <p className="state">No patients match these filters.</p>
            : <div className="table-wrap"><table>
                <thead><tr><th>Number</th><th>Patient</th><th>Phone</th><th>Gender</th><th>Date of birth</th><th>Registered (UTC)</th></tr></thead>
                <tbody>{preview.data.rows.map(row => (
                  <tr key={row.patientId}>
                    <td className="mono">{row.patientNumber}</td>
                    <td><Link className="patient-link" to={`/patients/${row.patientId}`}>{row.patientName}</Link></td>
                    <td>{row.phone}</td><td>{row.gender ?? '—'}</td><td>{row.dateOfBirth ?? '—'}</td>
                    <td>{new Date(row.createdAtUtc).toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table></div>}
        </>
      )}
    </section>
  )
}
