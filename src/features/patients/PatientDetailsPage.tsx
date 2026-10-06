import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getPatient } from './api'

export function PatientDetailsPage() {
  const { patientId } = useParams()

  const patientQuery = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => getPatient(patientId!),
    enabled: Boolean(patientId),
  })

  if (patientQuery.isLoading) {
    return <main className="page-shell"><p className="state">Loading patient…</p></main>
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <main className="page-shell">
        <Link className="back-link" to="/patients">← Patients</Link>
        <p className="state error">Unable to load patient.</p>
      </main>
    )
  }

  const patient = patientQuery.data

  return (
    <main className="page-shell">
      <Link className="back-link" to="/patients">← Patients</Link>

      <section className="page-header patient-profile-header">
        <div>
          <p className="eyebrow mono">{patient.patientNumber}</p>
          <h1>{patient.fullName}</h1>
          <p className="muted">Patient profile</p>
        </div>
      </section>

      <section className="panel">
        <div className="profile-grid">
          <div>
            <span className="profile-label">Phone</span>
            <strong className="mono">{patient.phone}</strong>
          </div>
          <div>
            <span className="profile-label">Date of birth</span>
            <strong>{patient.dateOfBirth ?? 'Not provided'}</strong>
          </div>
          <div>
            <span className="profile-label">Gender</span>
            <strong>{patient.gender ?? 'Not provided'}</strong>
          </div>
          <div>
            <span className="profile-label">Registered</span>
            <strong>{new Date(patient.createdDate).toLocaleDateString()}</strong>
          </div>
        </div>

        <div className="profile-notes">
          <span className="profile-label">Notes</span>
          <p>{patient.notes || 'No notes recorded.'}</p>
        </div>
      </section>
    </main>
  )
}
