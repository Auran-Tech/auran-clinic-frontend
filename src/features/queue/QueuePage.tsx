import './queue.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getWorkflowConfiguration } from '../workflow/api'
import { getActiveQueue, getQueueTransitions, moveQueueEntry } from './api'
import type { QueueEntry } from './types'

function waitingMinutes(entry: QueueEntry) {
  const arrival = new Date(entry.entryAtUtc).getTime()
  return Number.isFinite(arrival)
    ? Math.max(0, Math.floor((Date.now() - arrival) / 60_000))
    : 0
}

function QueueActions({ entry }: { entry: QueueEntry }) {
  const { t } = useTranslation('queue')
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
      await queryClient.invalidateQueries({
        queryKey: ['queue-transitions', entry.queueEntryId],
      })
      await queryClient.invalidateQueries({ queryKey: ['active-queue'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      await queryClient.invalidateQueries({ queryKey: ['active-visit', entry.patientId] })
    },
  })

  if (!auth.hasPermission('Queue_Move'))
    return <span className="muted">{t('viewOnly')}</span>

  return (
    <div className="queue-move">
      <select
        aria-label={t('moveTo')}
        value={selectedStatusId}
        onChange={(event) => setSelectedStatusId(event.target.value)}
      >
        <option value="">{t('moveTo')}</option>
        {(transitionsQuery.data ?? []).map((status) => (
          <option key={status.workflowStatusId} value={status.workflowStatusId}>
            {status.name}
          </option>
        ))}
      </select>
      <button
        className="button secondary"
        disabled={!selectedStatusId || moveMutation.isPending}
        onClick={() =>
          moveMutation.mutate({
            queueEntryId: entry.queueEntryId,
            toWorkflowStatusId: selectedStatusId,
          })
        }
      >
        {moveMutation.isPending ? t('moving') : t('move')}
      </button>
      {moveMutation.isError && (
        <small className="field-error" role="alert">
          {t('moveError')}
        </small>
      )}
    </div>
  )
}

function QueueCard({ entry }: { entry: QueueEntry }) {
  const { t } = useTranslation('queue')
  return (
    <article className="queue-board-card">
      <div className="queue-board-patient">
        <Link to={`/patients/${entry.patientId}`}>{entry.patientName}</Link>
        <small dir="ltr">{entry.patientNumber}</small>
      </div>
      <div className="queue-board-meta">
        <span>{t('waitTime', { count: waitingMinutes(entry) })}</span>
        <span>{entry.doctorName ?? t('unassigned')}</span>
      </div>
      <QueueActions entry={entry} />
    </article>
  )
}

function QueueRow({ entry }: { entry: QueueEntry }) {
  const { t } = useTranslation('queue')
  return (
    <tr>
      <td className="mono" dir="ltr">
        {entry.patientNumber}
      </td>
      <td>
        <Link className="patient-link" to={`/patients/${entry.patientId}`}>
          <strong>{entry.patientName}</strong>
        </Link>
      </td>
      <td>{entry.doctorName ?? t('unassigned')}</td>
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
      <td>{t('waitTime', { count: waitingMinutes(entry) })}</td>
      <td>
        <QueueActions entry={entry} />
      </td>
    </tr>
  )
}

export function QueuePage() {
  const auth = useAuth()
  const { t } = useTranslation('queue')
  const [view, setView] = useState<'board' | 'list'>('board')
  const [search, setSearch] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const queueQuery = useQuery({
    queryKey: ['queue'],
    queryFn: getActiveQueue,
    refetchInterval: 30_000,
    enabled: auth.hasPermission('Queue_View'),
  })
  const workflowQuery = useQuery({
    queryKey: ['workflow-config'],
    queryFn: getWorkflowConfiguration,
    enabled: auth.hasPermission('Queue_View') && auth.hasPermission('Settings_View'),
  })

  if (!auth.hasPermission('Queue_View'))
    return (
      <main className="page-shell">
        <p className="state error" role="alert">
          {t('forbidden')}
        </p>
      </main>
    )

  const entries = queueQuery.data ?? []
  const doctors = [
    ...new Map(
      entries
        .filter((entry) => entry.doctorId)
        .map((entry) => [
          entry.doctorId,
          { id: entry.doctorId!, name: entry.doctorName ?? entry.doctorId! },
        ]),
    ).values(),
  ]
  const term = search.trim().toLocaleLowerCase()
  const visible = entries.filter(
    (entry) =>
      (!doctorId || entry.doctorId === doctorId) &&
      (!term ||
        `${entry.patientName} ${entry.patientNumber}`.toLocaleLowerCase().includes(term)),
  )
  const configuredStages = (workflowQuery.data?.statuses ?? [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(
      (status) =>
        [status.id, { id: status.id, name: status.name, color: status.color }] as const,
    )
  const stages = [
    ...new Map([
      ...configuredStages,
      ...entries.map(
        (entry) =>
          [
            entry.workflowStatusId,
            {
              id: entry.workflowStatusId,
              name: entry.workflowStatusName,
              color: entry.workflowStatusColor,
            },
          ] as const,
      ),
    ]).values(),
  ]
  const occupiedStages = new Set(entries.map((entry) => entry.workflowStatusId)).size
  const averageWait = entries.length
    ? Math.round(
        entries.reduce((sum, entry) => sum + waitingMinutes(entry), 0) / entries.length,
      )
    : 0

  return (
    <main className="page-shell queue-page">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('operations')}</p>
          <h1>{t('title')}</h1>
          <p className="muted">{t('subtitle')}</p>
        </div>
        <div className="actions">
          <Link className="button secondary nav-button" to="/pending-documentation">
            {t('pendingDocs')}
          </Link>
          <Link className="button secondary nav-button" to="/patients">
            {t('patients')}
          </Link>
        </div>
      </section>
      <section className="queue-summary" aria-label={t('summary')}>
        <article className="panel">
          <small>{t('inFlow')}</small>
          <strong>{entries.length}</strong>
        </article>
        <article className="panel">
          <small>{t('averageWait')}</small>
          <strong>{t('waitTime', { count: averageWait })}</strong>
        </article>
        <article className="panel">
          <small>{t('activeStages')}</small>
          <strong>{occupiedStages}</strong>
        </article>
      </section>
      <div className="queue-toolbar">
        <input
          className="input"
          aria-label={t('search')}
          placeholder={t('search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label={t('doctor')}
          value={doctorId}
          onChange={(event) => setDoctorId(event.target.value)}
        >
          <option value="">{t('allDoctors')}</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </select>
        <span className="queue-live-badge">{t('liveUpdates')}</span>
        <div className="queue-view-switch" role="group" aria-label={t('view')}>
          <button
            type="button"
            className={view === 'board' ? 'active' : ''}
            onClick={() => setView('board')}
          >
            {t('board')}
          </button>
          <button
            type="button"
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            {t('list')}
          </button>
        </div>
      </div>
      {queueQuery.isLoading && (
        <p className="state" role="status">
          {t('loading')}
        </p>
      )}
      {queueQuery.isError && (
        <p className="state error" role="alert">
          {t('error')}
        </p>
      )}
      {queueQuery.data && entries.length === 0 && <p className="state">{t('empty')}</p>}
      {queueQuery.data && entries.length > 0 && visible.length === 0 && (
        <p className="state">{t('noMatches')}</p>
      )}
      {queueQuery.data && visible.length > 0 && view === 'board' && (
        <div className="queue-board">
          {stages.map((stage) => (
            <section className="queue-lane" key={stage.id} aria-label={stage.name}>
              <header>
                <span
                  className="queue-lane-color"
                  style={{ backgroundColor: stage.color || '#4c8dff' }}
                />
                <h2>{stage.name}</h2>
                <b>
                  {visible.filter((entry) => entry.workflowStatusId === stage.id).length}
                </b>
              </header>
              <div className="queue-lane-cards">
                {visible
                  .filter((entry) => entry.workflowStatusId === stage.id)
                  .map((entry) => (
                    <QueueCard key={entry.queueEntryId} entry={entry} />
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {queueQuery.data && visible.length > 0 && view === 'list' && (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('patientNumber')}</th>
                  <th>{t('patient')}</th>
                  <th>{t('doctor')}</th>
                  <th>{t('stage')}</th>
                  <th>{t('waiting')}</th>
                  <th>{t('workflow')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => (
                  <QueueRow key={entry.queueEntryId} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  )
}
