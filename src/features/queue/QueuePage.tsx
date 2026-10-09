import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getActiveQueue, getQueueTransitions, moveQueueEntry } from './api'
import type { QueueEntry } from './types'

function QueueRow({ entry }: { entry: QueueEntry }) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
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
      <td>{entry.doctorName ?? t('queuePage.unassigned')}</td>
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
      <td>{t('queuePage.minutes', { count: elapsedMinutes })}</td>
      <td>
        {auth.hasPermission('Queue_Move') ? (
          <div className="queue-move">
            <select
              value={selectedStatusId}
              onChange={(event) => setSelectedStatusId(event.target.value)}
            >
              <option value="">{t('queuePage.moveTo')}</option>
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
              {moveMutation.isPending ? t('queuePage.moving') : t('queuePage.move')}
            </button>
            {moveMutation.isError && (
              <small className="field-error">{t('queuePage.transitionError')}</small>
            )}
          </div>
        ) : (
          <span className="muted">{t('queuePage.viewOnly')}</span>
        )}
      </td>
    </tr>
  )
}

export function QueuePage() {
  const auth = useAuth()
  const { t } = useTranslation()
  const queueQuery = useQuery({
    queryKey: ['queue'],
    queryFn: getActiveQueue,
    refetchInterval: 30_000,
    enabled: auth.hasPermission('Queue_View'),
  })

  if (!auth.hasPermission('Queue_View')) {
    return (
      <main className="page-shell">
        <p className="state error">{t('queuePage.denied')}</p>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('queuePage.eyebrow')}</p>
          <h1>{t('queuePage.title')}</h1>
          <p className="muted">{t('queuePage.intro')}</p>
        </div>
        <div className="actions">
          <Link className="button secondary nav-button" to="/pending-documentation">
            {t('common.pendingDocumentation')}
          </Link>
          <Link className="button secondary nav-button" to="/patients">{t('common.patients')}</Link>
        </div>
      </section>

      <section className="panel">
        {queueQuery.isLoading && <p className="state">{t('queuePage.loading')}</p>}
        {queueQuery.isError && <p className="state error">{t('queuePage.loadError')}</p>}
        {queueQuery.data?.length === 0 && <p className="state">{t('queuePage.empty')}</p>}

        {queueQuery.data && queueQuery.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('queuePage.patientNo')}</th>
                  <th>{t('queuePage.patient')}</th>
                  <th>{t('queuePage.doctor')}</th>
                  <th>{t('queuePage.stage')}</th>
                  <th>{t('queuePage.waiting')}</th>
                  <th>{t('queuePage.workflow')}</th>
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
