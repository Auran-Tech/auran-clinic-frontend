import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { cancelFollowUp, completeFollowUp, getFollowUps } from './api'
import type { FollowUpBucket } from './types'

const buckets: FollowUpBucket[] = ['Today', 'Upcoming', 'Overdue', 'Completed']

export function FollowUpsPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [bucket, setBucket] = useState<FollowUpBucket>('Today')

  const query = useQuery({
    queryKey: ['follow-ups', bucket],
    queryFn: () => getFollowUps(bucket),
    enabled: auth.hasPermission('FollowUp_View'),
  })

  const completeMutation = useMutation({
    mutationFn: completeFollowUp,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelFollowUp,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
    },
  })

  if (!auth.hasPermission('FollowUp_View')) {
    return (
      <main className="page-shell">
        <p className="state error">You do not have permission to view follow-ups.</p>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Patient continuity</p>
          <h1>Follow-ups</h1>
          <p className="muted">Today, upcoming, overdue, and completed patient reviews.</p>
        </div>
        <div className="actions">
          {(auth.hasPermission('Users_View') || auth.hasPermission('RBAC_View')) && (
            <Link className="button secondary nav-button" to="/employees">Employees</Link>
          )}
          <Link className="button secondary nav-button" to="/pending-documentation">
            Pending documentation
          </Link>
          <Link className="button secondary nav-button" to="/queue">Live queue</Link>
          <Link className="button secondary nav-button" to="/patients">Patients</Link>
        </div>
      </section>

      <section className="panel">
        <div className="bucket-tabs" role="tablist" aria-label="Follow-up status">
          {buckets.map((item) => (
            <button
              key={item}
              className={`button ${bucket === item ? 'primary' : 'secondary'}`}
              onClick={() => setBucket(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {query.isLoading && <p className="state">Loading follow-ups…</p>}
        {query.isError && <p className="state error">Unable to load follow-ups.</p>}
        {query.data?.length === 0 && <p className="state">No {bucket.toLowerCase()} follow-ups.</p>}

        {query.data && query.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Recommendation</th>
                  <th>Recommended date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((followUp) => (
                  <tr key={followUp.id}>
                    <td>
                      <Link className="patient-link" to={`/patients/${followUp.patientId}`}>
                        <strong>{followUp.patientName}</strong>
                      </Link>
                      <div className="muted mono">{followUp.patientNumber}</div>
                    </td>
                    <td>{followUp.doctorName}</td>
                    <td>{followUp.recommendation}</td>
                    <td>{followUp.recommendedDate ?? '—'}</td>
                    <td>{followUp.status}</td>
                    <td>
                      {followUp.status === 'Open' && auth.hasPermission('FollowUp_Manage') && (
                        <div className="actions">
                          <button
                            className="button secondary"
                            disabled={completeMutation.isPending}
                            onClick={() => completeMutation.mutate(followUp.id)}
                          >
                            Complete
                          </button>
                          <button
                            className="button danger"
                            disabled={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(followUp.id)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
