import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPatientVisitHistory } from './api'

export function PatientVisitHistoryPanel({ patientId }: { patientId: string }) {
  const [page, setPage] = useState(1)
  const pageSize = 10

  const query = useQuery({
    queryKey: ['patient-visit-history', patientId, page],
    queryFn: () => getPatientVisitHistory(patientId, page, pageSize),
  })

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Visit history</h2>
          <p className="muted">
            Previous and active clinic encounters, newest first.
          </p>
        </div>
      </div>

      {query.isLoading && <p className="state">Loading visit history…</p>}
      {query.isError && <p className="state error">Unable to load visit history.</p>}

      {query.data && query.data.visits.data.length === 0 && (
        <p className="state">No clinic visits recorded for this patient.</p>
      )}

      {query.data && query.data.visits.data.length > 0 && (
        <>
          <div className="visit-history-list">
            {query.data.visits.data.map((visit) => (
              <article className="visit-history-card" key={visit.visitId}>
                <div className="visit-history-heading">
                  <div>
                    <strong>{new Date(visit.entryAtUtc).toLocaleString()}</strong>
                    <p className="muted">Dr. {visit.doctorName}</p>
                  </div>
                  <div className="role-badges">
                    <span className="role-badge">{visit.status}</span>
                    <span className="role-badge">{visit.documentationStatus}</span>
                  </div>
                </div>

                <div className="visit-history-meta">
                  <div>
                    <span className="profile-label">Sessions</span>
                    <strong>{visit.sessionCount}</strong>
                  </div>
                  <div>
                    <span className="profile-label">Completed</span>
                    <strong>
                      {visit.completedAtUtc
                        ? new Date(visit.completedAtUtc).toLocaleString()
                        : '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="profile-label">Exited</span>
                    <strong>
                      {visit.exitAtUtc
                        ? new Date(visit.exitAtUtc).toLocaleString()
                        : '—'}
                    </strong>
                  </div>
                </div>

                {(visit.chiefComplaint || visit.diagnosis) && (
                  <div className="visit-history-summary">
                    {visit.chiefComplaint && (
                      <div>
                        <span className="profile-label">Chief complaint</span>
                        <p>{visit.chiefComplaint}</p>
                      </div>
                    )}
                    {visit.diagnosis && (
                      <div>
                        <span className="profile-label">Diagnosis</span>
                        <p>{visit.diagnosis}</p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="visit-history-pagination">
            <span className="muted">
              Page {query.data.visits.setting.currentPage} of{' '}
              {query.data.visits.setting.totalPage} ·{' '}
              {query.data.visits.setting.totalCount} visits
            </span>
            <div className="actions">
              <button
                className="button secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Newer
              </button>
              <button
                className="button secondary"
                disabled={page >= query.data.visits.setting.totalPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Older
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
