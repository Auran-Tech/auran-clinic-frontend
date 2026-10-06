import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getActiveQueue, getQueueTransitions, moveQueueEntry } from './api'
import type { QueueEntry } from './types'

function QueueRow({ entry }: { entry: QueueEntry }) {
  const queryClient = useQueryClient()
  const auth = useAuth()
  const [selectedStatusId, setSelectedStatusId] = useState('')

  const transitionsQuery = useQuery({
    queryKey: ['queue-transitions', entry.queueEntryId],
    queryFn: () => getQueueTransitions(entry.queueEntryId),
    enabled: auth.hasPermission('Queue_Move'),
  })

  const moveMutation = useMutation({
    mutationFn: moveQueueEntry,
    onSuccess: async () => {
      setSelectedStatusId('')
      await queryClient.invalidateQueries({ queryKey: ['queue'] })
      await queryClient.invalidateQueries({ queryKey: ['queue-transitions', entry.queueEntryId] })
      await queryClient.invalidateQueries({ queryKey: ['active-visit', entry.patientId] })
    },
  })

  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(entry.entryAtUtc).getTime()) / 60000),
  )

  return (
    <tr>
      <td className="mono">{entry.patientNumber}</td>
      <td>
        <Link className="patient-link" to={`/patients/${entry.patientId}`}>
          <strong>{entry.patientName}</strong>
        </Link>
      </td>
      <td>{entry.doctorName ?? 'Unassigned'}</td>
      <td>
        <span className="status-pill">
          <span
            className="status-dot"
            style={{ background: entry.workflowStatusColor }}
            aria-hidden="true"
          />
          {entry.workflowStatusName}
        </span>
      </td>
      <td>{elapsedMinutes} min</td>
      <td>
        {auth.hasPermission('Queue_Move') ? (
          <div className="queue-move">
            <select
              value={selectedStatusId}
              onChange={(event) => setSelectedStatusId(event.target.value)}
            >
              <option value="">Move to…</option>
              {(transitionsQuery.data ?? []).map((status) => (
                <option key={status.workflowStatusId} value={status.workflowStatusId}>
                  {status.name}
                </option>
              ))}
            </select>
            <button
              className="button secondary"
              disabled={!selectedStatusId || moveMutation.isPending}
              onClick={() => moveMutation.mutate({
                queueEntryId: entry.queueEntryId,
                toWorkflowStatusId: selectedStatusId,
              })}
            >
              {moveMutation.isPending ? 'Moving…' : 'Move'}
            </button>
            {moveMutation.isError && (
              <small className="field-error">Transition is no longer available.</small>
            )}
          </div>
        ) : (
          <span className="muted">View only</span>
        )}
      </td>
    </tr>
  )
}

export function QueuePage() {
  const auth = useAuth()
  const queueQuery = useQuery({
    queryKey: ['queue'],
    queryFn: getActiveQueue,
    refetchInterval: 30_000,
    enabled: auth.hasPermission('Queue_View'),
  })

  if (!auth.hasPermission('Queue_View')) {
    return (
      <main className="page-shell">
        <p className="state error">You do not have permission to view the clinic queue.</p>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Clinic operations</p>
          <h1>Live queue</h1>
          <p className="muted">Active patients ordered by workflow stage and arrival time.</p>
        </div>
        <Link className="button secondary nav-button" to="/patients">Patients</Link>
      </section>

      <section className="panel">
        {queueQuery.isLoading && <p className="state">Loading clinic queue…</p>}
        {queueQuery.isError && <p className="state error">Unable to load the clinic queue.</p>}
        {queueQuery.data?.length === 0 && <p className="state">The active queue is empty.</p>}

        {queueQuery.data && queueQuery.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient no.</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Stage</th>
                  <th>Waiting</th>
                  <th>Workflow</th>
                </tr>
              </thead>
              <tbody>
                {queueQuery.data.map((entry) => (
                  <QueueRow key={entry.queueEntryId} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
