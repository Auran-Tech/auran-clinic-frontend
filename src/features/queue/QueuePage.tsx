import './queue.css'
import { useState, type CSSProperties, type DragEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Clock3,
  Layers3,
  List,
  LayoutGrid,
  ListFilter,
  Plus,
  Stethoscope,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { useAuth } from '../auth/AuthContext'
import { getWorkflowConfiguration } from '../workflow/api'
import { getQueueTransitions, getSortedQueue } from './api'
import { QueueActions } from './QueueActions'
import { QueueArrivalDialog } from './QueueArrivalDialog'
import { KpiCard } from '../../components/ui/KpiCard'
import { stageLabel } from './stageLabel'
import type { QueueEntry } from './types'
import type { QueueTransitionOption } from './types'
import { QUEUE_SORT_CHOICE, QUEUE_SORT_QUERY, type QueueSortChoice } from './listOptions'
import { useMoveQueueEntry } from './useMoveQueueEntry'

interface QueueFilters {
  search: string
  doctorId: string
  stageId: string
  sort: QueueSortChoice
}

interface DraggingEntry {
  entryId: string
  fromStageId: string
  allowedStageIds: string[] | null
}

function waitingMinutes(entry: QueueEntry) {
  const arrival = new Date(entry.entryAtUtc).getTime()
  const departure = entry.exitAtUtc ? new Date(entry.exitAtUtc).getTime() : Date.now()
  return Number.isFinite(arrival)
    ? Math.max(0, Math.floor((departure - arrival) / 60_000))
    : 0
}

interface QueueEntryProps {
  entry: QueueEntry
  waitLabel: (entry: QueueEntry) => string
  onDragStart?: (event: DragEvent<HTMLElement>, entry: QueueEntry) => void
  onDragEnd?: () => void
}

function QueueCard({ entry, waitLabel, onDragStart, onDragEnd }: QueueEntryProps) {
  const { t } = useTranslation('queue')

  return (
    <article
      className={`queue-board-card${onDragStart ? ' is-draggable' : ''}`}
      draggable={Boolean(onDragStart)}
      onDragStart={(event) => onDragStart?.(event, entry)}
      onDragEnd={onDragEnd}
    >
      <Link className="queue-card-name" to={`/patients/${entry.patientId}`}>
        {entry.patientName}
      </Link>
      <small className="queue-card-number" dir="ltr">
        {entry.patientNumber}
      </small>
      <div className="queue-card-meta">
        <span>{t('waitLabel', { value: waitLabel(entry) })}</span>
        <span title={entry.doctorName ?? t('unassigned')}>
          {entry.doctorName ?? t('unassigned')}
        </span>
      </div>
      <div className="queue-card-actions">
        <Link className="queue-profile-link" to={`/patients/${entry.patientId}`}>
          <UserRound size={13} aria-hidden="true" />
          {t('profile')}
        </Link>
        {!entry.exitAtUtc && <QueueActions entry={entry} />}
      </div>
    </article>
  )
}

function QueueRow({ entry, waitLabel }: QueueEntryProps) {
  const { t, i18n } = useTranslation('queue')

  return (
    <tr>
      <td>
        <div className="queue-patient-cell">
          <span className="queue-patient-avatar" aria-hidden="true">
            <UserRound size={17} />
          </span>
          <span className="queue-patient-identity">
            <Link className="queue-row-name" to={`/patients/${entry.patientId}`}>
              {entry.patientName}
            </Link>
            <small dir="ltr">{entry.patientNumber}</small>
          </span>
        </div>
      </td>
      <td>
        <span className="queue-status-pill">
          <span
            className="queue-status-dot"
            style={{ backgroundColor: entry.workflowStatusColor }}
            aria-hidden="true"
          />
          {stageLabel(
            entry.workflowStatusCode,
            entry.workflowStatusName,
            i18n.language,
            t,
          )}
        </span>
      </td>
      <td>{waitLabel(entry)}</td>
      <td>{entry.doctorName ?? t('unassigned')}</td>
      <td>
        <div className="queue-row-actions">
          <Link className="queue-profile-link" to={`/patients/${entry.patientId}`}>
            {t('profile')}
          </Link>
          {!entry.exitAtUtc && <QueueActions entry={entry} />}
        </div>
      </td>
    </tr>
  )
}

export function QueuePage() {
  const auth = useAuth()
  const { t, i18n } = useTranslation('queue')
  const [view, setView] = useState<'board' | 'list'>('board')
  const [filters, setFilters] = useState<QueueFilters>({
    search: '',
    doctorId: '',
    stageId: '',
    sort: QUEUE_SORT_CHOICE.stage,
  })
  const [draft, setDraft] = useState<QueueFilters>(filters)
  const [showFilters, setShowFilters] = useState(false)
  const [showArrival, setShowArrival] = useState(false)
  const [dragging, setDragging] = useState<DraggingEntry | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState('')
  const [dragError, setDragError] = useState('')
  const [pendingDrop, setPendingDrop] = useState<{
    entry: QueueEntry
    target: QueueTransitionOption
  } | null>(null)
  const moveMutation = useMoveQueueEntry()
  const canView = auth.hasPermission('Queue_View')
  const canMove = auth.hasPermission('Queue_Move')
  const queueQuery = useQuery({
    queryKey: ['queue', filters.sort],
    queryFn: () => getSortedQueue(QUEUE_SORT_QUERY[filters.sort], true),
    refetchInterval: 30_000,
    enabled: canView,
  })
  const workflowQuery = useQuery({
    queryKey: ['workflow-config'],
    queryFn: getWorkflowConfiguration,
    enabled: canView && auth.hasPermission('Settings_View'),
  })

  if (!canView) {
    return (
      <main className="page-shell">
        <p className="state error" role="alert">
          {t('forbidden')}
        </p>
      </main>
    )
  }

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
  const configuredStages = (workflowQuery.data?.statuses ?? [])
    .slice()
    .sort((left, right) =>
      left.isSystemFinal === right.isSystemFinal
        ? left.sortOrder - right.sortOrder
        : left.isSystemFinal
          ? 1
          : -1,
    )
    .map(
      (status) =>
        [
          status.id,
          {
            id: status.id,
            code: status.code,
            name: status.name,
            color: status.color,
          },
        ] as const,
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
              code: entry.workflowStatusCode,
              name: entry.workflowStatusName,
              color: entry.workflowStatusColor,
            },
          ] as const,
      ),
    ]).values(),
  ]
  const term = filters.search.trim().toLocaleLowerCase()
  const visible = entries.filter(
    (entry) =>
      (!filters.doctorId || entry.doctorId === filters.doctorId) &&
      (!filters.stageId || entry.workflowStatusId === filters.stageId) &&
      (!term ||
        `${entry.patientName} ${entry.patientNumber}`.toLocaleLowerCase().includes(term)),
  )
  const activeEntries = entries.filter((entry) => !entry.exitAtUtc)
  const assignedDoctors = new Set(
    activeEntries.map((entry) => entry.doctorId).filter(Boolean),
  ).size
  const occupiedStages = new Set(activeEntries.map((entry) => entry.workflowStatusId))
    .size
  const formatWait = (minutes: number) =>
    minutes < 60
      ? t('waitShort', { count: minutes })
      : t('waitHours', {
          hours: Math.floor(minutes / 60),
          minutes: minutes % 60,
        })
  const waitLabel = (entry: QueueEntry) => formatWait(waitingMinutes(entry))
  const doctorOptions = [
    { label: t('allDoctors'), value: '' },
    ...doctors.map((doctor) => ({ label: doctor.name, value: doctor.id })),
  ]
  const stageOptions = [
    { label: t('allStages'), value: '' },
    ...stages.map((stage) => ({
      label: stageLabel(stage.code, stage.name, i18n.language, t),
      value: stage.id,
    })),
  ]
  const activeFilterCount =
    Number(Boolean(filters.search.trim())) +
    Number(Boolean(filters.doctorId)) +
    Number(Boolean(filters.stageId))
  const activeWait = activeEntries.length
    ? Math.round(
        activeEntries.reduce((sum, entry) => sum + waitingMinutes(entry), 0) /
          activeEntries.length,
      )
    : 0

  function sortByHeader(ascending: QueueSortChoice, descending: QueueSortChoice) {
    setFilters((current) => ({
      ...current,
      sort: current.sort === ascending ? descending : ascending,
    }))
  }

  function beginDrag(event: DragEvent<HTMLElement>, entry: QueueEntry) {
    if (!canMove) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', entry.queueEntryId)
    setDragError('')
    setDragging({
      entryId: entry.queueEntryId,
      fromStageId: entry.workflowStatusId,
      allowedStageIds: null,
    })
    getQueueTransitions(entry.queueEntryId)
      .then((transitions) => {
        setDragging((current) =>
          current?.entryId === entry.queueEntryId
            ? {
                ...current,
                allowedStageIds: transitions.map((item) => item.workflowStatusId),
              }
            : current,
        )
      })
      .catch(() => {
        setDragError(t('transitionsError'))
        setDragging(null)
      })
  }

  async function dropOnStage(event: DragEvent<HTMLElement>, targetStageId: string) {
    event.preventDefault()
    setDragOverStageId('')
    const entryId = event.dataTransfer.getData('text/plain') || dragging?.entryId
    setDragging(null)
    const entry = entries.find((item) => item.queueEntryId === entryId)
    if (!canMove || !entry || entry.workflowStatusId === targetStageId) return

    try {
      const transitions = await getQueueTransitions(entry.queueEntryId)
      const target = transitions.find((item) => item.workflowStatusId === targetStageId)
      if (!target) {
        setDragError(t('invalidDrop'))
        return
      }
      if (target.isSystemFinal) {
        setPendingDrop({ entry, target })
        return
      }
      await moveMutation.mutateAsync({
        queueEntryId: entry.queueEntryId,
        toWorkflowStatusId: targetStageId,
      })
    } catch {
      setDragError(t('moveError'))
    }
  }

  function sortDirection(
    ascending: QueueSortChoice,
    descending: QueueSortChoice,
  ): DataTableColumn['sortDirection'] {
    return filters.sort === ascending
      ? 'ascending'
      : filters.sort === descending
        ? 'descending'
        : 'none'
  }

  const columns: DataTableColumn[] = [
    {
      key: 'patient',
      label: t('patient'),
      sortDirection: sortDirection(QUEUE_SORT_CHOICE.nameAsc, QUEUE_SORT_CHOICE.nameDesc),
      onSort: () => sortByHeader(QUEUE_SORT_CHOICE.nameAsc, QUEUE_SORT_CHOICE.nameDesc),
    },
    {
      key: 'stage',
      label: t('stage'),
      sortDirection: sortDirection(QUEUE_SORT_CHOICE.stage, QUEUE_SORT_CHOICE.stageDesc),
      onSort: () => sortByHeader(QUEUE_SORT_CHOICE.stage, QUEUE_SORT_CHOICE.stageDesc),
    },
    {
      key: 'waiting',
      label: t('waiting'),
      sortDirection: sortDirection(
        QUEUE_SORT_CHOICE.longestWait,
        QUEUE_SORT_CHOICE.newestArrival,
      ),
      onSort: () =>
        sortByHeader(QUEUE_SORT_CHOICE.longestWait, QUEUE_SORT_CHOICE.newestArrival),
    },
    {
      key: 'doctor',
      label: t('doctor'),
      sortDirection: sortDirection(
        QUEUE_SORT_CHOICE.doctorAsc,
        QUEUE_SORT_CHOICE.doctorDesc,
      ),
      onSort: () =>
        sortByHeader(QUEUE_SORT_CHOICE.doctorAsc, QUEUE_SORT_CHOICE.doctorDesc),
    },
    { key: 'workflow', label: t('workflow') },
  ]

  return (
    <main className="page-shell queue-page">
      <header className="queue-header">
        <div className="queue-breadcrumb">
          <span>{t('operations')}</span>
          <span aria-hidden="true">·</span>
          <strong>{t('queueShort')}</strong>
        </div>
        <div className="queue-heading-row">
          <div>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          {auth.hasPermission('Patient_View') && auth.hasPermission('Visit_Start') && (
            <button
              className="button primary queue-arrival-button"
              type="button"
              title={t('registerArrivalHelp')}
              onClick={() => setShowArrival(true)}
            >
              <Plus size={15} aria-hidden="true" />
              {t('registerArrival')}
            </button>
          )}
        </div>
      </header>

      <section
        className="queue-summary"
        aria-label={t('summary')}
        aria-busy={queueQuery.isLoading}
      >
        <KpiCard
          label={t('inFlow')}
          value={queueQuery.data ? activeEntries.length : '—'}
          detail={t('inFlowDetail')}
          icon={UsersRound}
          tone="blue"
        />
        <KpiCard
          label={t('averageWait')}
          value={queueQuery.data ? formatWait(activeWait) : '—'}
          detail={t('averageWaitDetail')}
          icon={Clock3}
          tone="amber"
        />
        <KpiCard
          label={t('activeStages')}
          value={queueQuery.data ? occupiedStages : '—'}
          detail={t('activeStagesDetail')}
          icon={Layers3}
          tone="violet"
        />
        <KpiCard
          label={t('assignedDoctors')}
          value={queueQuery.data ? assignedDoctors : '—'}
          detail={t('assignedDoctorsDetail')}
          icon={Stethoscope}
          tone="teal"
        />
      </section>

      <div className="queue-toolbar">
        <div className="queue-view-switch" role="group" aria-label={t('view')}>
          <button
            type="button"
            className={view === 'board' ? 'active' : ''}
            aria-pressed={view === 'board'}
            onClick={() => setView('board')}
          >
            <LayoutGrid size={13} aria-hidden="true" />
            {t('board')}
          </button>
          <button
            type="button"
            className={view === 'list' ? 'active' : ''}
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            <List size={13} aria-hidden="true" />
            {t('list')}
          </button>
        </div>
        <div className="queue-filter-actions">
          <button
            type="button"
            className="button secondary"
            disabled={activeFilterCount === 0}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                search: '',
                doctorId: '',
                stageId: '',
              }))
            }
          >
            {t('clearFilters')}
          </button>
          <button
            type="button"
            className="button secondary queue-filter-button"
            onClick={() => {
              setDraft(filters)
              setShowFilters(true)
            }}
          >
            <ListFilter size={15} aria-hidden="true" />
            {t('filters')}
            {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
          </button>
        </div>
      </div>
      {dragError && (
        <p className="queue-drag-error" role="alert">
          {dragError}
        </p>
      )}

      {queueQuery.isLoading && (
        <p className="queue-state" role="status">
          {t('loading')}
        </p>
      )}
      {queueQuery.isError && (
        <div className="queue-state" role="alert">
          <p>{t('error')}</p>
          <button className="button secondary" onClick={() => queueQuery.refetch()}>
            {t('retry')}
          </button>
        </div>
      )}
      {queueQuery.data && entries.length === 0 && (
        <p className="queue-state">{t('empty')}</p>
      )}
      {queueQuery.data && entries.length > 0 && visible.length === 0 && (
        <p className="queue-state">{t('noMatches')}</p>
      )}

      {queueQuery.data && visible.length > 0 && view === 'board' && (
        <div className="queue-board">
          {stages
            .filter((stage) => !filters.stageId || stage.id === filters.stageId)
            .map((stage) => {
              const stageEntries = visible.filter(
                (entry) => entry.workflowStatusId === stage.id,
              )
              const displayName = stageLabel(stage.code, stage.name, i18n.language, t)
              const isAllowedDrop =
                dragging?.fromStageId !== stage.id &&
                dragging?.allowedStageIds?.includes(stage.id)
              return (
                <section
                  className={`queue-lane${isAllowedDrop ? ' can-drop' : ''}${
                    dragOverStageId === stage.id ? ' is-drag-over' : ''
                  }`}
                  key={stage.id}
                  aria-label={displayName}
                  onDragOver={(event) => {
                    if (!dragging || dragging.fromStageId === stage.id) return
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                    setDragOverStageId(stage.id)
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                      setDragOverStageId('')
                    }
                  }}
                  onDrop={(event) => void dropOnStage(event, stage.id)}
                  style={
                    { '--queue-stage-color': stage.color || '#4c8dff' } as CSSProperties
                  }
                >
                  <header className="queue-lane-head">
                    <div>
                      <h2>{displayName}</h2>
                      <small>
                        {stage.code === 'EXIT'
                          ? t('recentExits')
                          : t('patientsInStage', { count: stageEntries.length })}
                      </small>
                    </div>
                    <span className="queue-lane-count">{stageEntries.length}</span>
                  </header>
                  <div className="queue-lane-cards">
                    {stageEntries.map((entry) => (
                      <QueueCard
                        key={entry.queueEntryId}
                        entry={entry}
                        waitLabel={waitLabel}
                        onDragStart={canMove && !entry.exitAtUtc ? beginDrag : undefined}
                        onDragEnd={() => {
                          setDragging(null)
                          setDragOverStageId('')
                        }}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
        </div>
      )}

      {queueQuery.data && visible.length > 0 && view === 'list' && (
        <section className="queue-list">
          <DataTable
            columns={columns}
            wrapClassName="queue-list-wrap"
            className="queue-list-table"
          >
            {visible.map((entry) => (
              <QueueRow key={entry.queueEntryId} entry={entry} waitLabel={waitLabel} />
            ))}
          </DataTable>
        </section>
      )}
      <Dialog
        header={t('filters')}
        visible={showFilters}
        modal
        draggable={false}
        resizable={false}
        className="auran-filter-dialog"
        onHide={() => setShowFilters(false)}
        footer={
          <div className="auran-filter-footer">
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                setDraft({
                  search: '',
                  doctorId: '',
                  stageId: '',
                  sort: filters.sort,
                })
              }
            >
              {t('clearFilters')}
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => {
                setFilters(draft)
                setShowFilters(false)
              }}
            >
              {t('applyFilters')}
            </button>
          </div>
        }
      >
        <div className="auran-filter-fields">
          <label htmlFor="queue-filter-search">
            {t('search')}
            <InputText
              id="queue-filter-search"
              className="auran-prime-field"
              value={draft.search}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
            />
          </label>
          <label htmlFor="queue-filter-stage">
            {t('stage')}
            <Dropdown
              inputId="queue-filter-stage"
              className="auran-prime-field"
              panelClassName="auran-prime-panel"
              value={draft.stageId}
              options={stageOptions}
              optionLabel="label"
              optionValue="value"
              filter
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  stageId: event.value as string,
                }))
              }
            />
          </label>
          <label htmlFor="queue-filter-doctor">
            {t('doctor')}
            <Dropdown
              inputId="queue-filter-doctor"
              className="auran-prime-field"
              panelClassName="auran-prime-panel"
              value={draft.doctorId}
              options={doctorOptions}
              optionLabel="label"
              optionValue="value"
              filter
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  doctorId: event.value as string,
                }))
              }
            />
          </label>
        </div>
      </Dialog>
      <Dialog
        header={t('confirmMove')}
        visible={Boolean(pendingDrop)}
        modal
        draggable={false}
        resizable={false}
        className="auran-filter-dialog"
        onHide={() => setPendingDrop(null)}
        footer={
          <div className="auran-filter-footer">
            <button
              type="button"
              className="button secondary"
              onClick={() => setPendingDrop(null)}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className="button primary"
              disabled={moveMutation.isPending}
              onClick={async () => {
                if (!pendingDrop) return
                try {
                  await moveMutation.mutateAsync({
                    queueEntryId: pendingDrop.entry.queueEntryId,
                    toWorkflowStatusId: pendingDrop.target.workflowStatusId,
                  })
                  setPendingDrop(null)
                } catch {
                  setDragError(t('moveError'))
                }
              }}
            >
              {moveMutation.isPending ? t('moving') : t('confirmMove')}
            </button>
          </div>
        }
      >
        <p>{t('finalTransitionWarning')}</p>
      </Dialog>
      {showArrival && (
        <QueueArrivalDialog
          activePatientIds={entries.map((entry) => entry.patientId)}
          onClose={() => setShowArrival(false)}
        />
      )}
    </main>
  )
}
