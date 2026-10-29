import './followUps.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CalendarDays,
  CircleCheck,
  Clock3,
  ListFilter,
  TriangleAlert,
} from 'lucide-react'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { KpiCard } from '../../components/ui/KpiCard'
import { TablePagination } from '../../components/ui/DataTable'
import { useAuth } from '../auth/AuthContext'
import { cancelFollowUp, completeFollowUp, getFollowUps } from './api'
import type { FollowUpBucket } from './types'

interface Filters {
  search: string
  doctorId: string
  bucket: FollowUpBucket
}

const emptyFilters: Filters = { search: '', doctorId: '', bucket: 'All' }
const summary = [
  { bucket: 'Today', icon: Clock3, tone: 'amber' },
  { bucket: 'Upcoming', icon: CalendarDays, tone: 'blue' },
  { bucket: 'Overdue', icon: TriangleAlert, tone: 'violet' },
  { bucket: 'Completed', icon: CircleCheck, tone: 'teal' },
] as const

function displayDate(value: string | null | undefined, language: string) {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date)
}

export function FollowUpsPage() {
  const { t, i18n } = useTranslation('followUps')
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const query = useQuery({
    queryKey: ['follow-ups', 'All'],
    queryFn: () => getFollowUps('All'),
    enabled: auth.hasPermission('FollowUp_View'),
  })
  const completeMutation = useMutation({
    mutationFn: completeFollowUp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follow-ups'] }),
  })
  const cancelMutation = useMutation({
    mutationFn: cancelFollowUp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follow-ups'] }),
  })

  const followUps = query.data ?? []
  const doctors = [
    { label: t('allDoctors'), value: '' },
    ...Array.from(new Map(followUps.map((item) => [item.doctorId, item.doctorName])))
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ]
  const search = filters.search.trim().toLocaleLowerCase()
  const filtered = followUps.filter(
    (item) =>
      (filters.bucket === 'All' || item.bucket === filters.bucket) &&
      (!filters.doctorId || item.doctorId === filters.doctorId) &&
      (!search ||
        [item.id, item.patientName, item.patientNumber, item.recommendation]
          .join(' ')
          .toLocaleLowerCase()
          .includes(search)),
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const firstRow = filtered.length ? (currentPage - 1) * pageSize + 1 : 0
  const lastRow = Math.min(currentPage * pageSize, filtered.length)
  const filterCount =
    Number(Boolean(filters.search.trim())) +
    Number(Boolean(filters.doctorId)) +
    Number(filters.bucket !== 'All')
  const pendingAction = completeMutation.isPending || cancelMutation.isPending

  function applyFilters(next: Filters) {
    setFilters(next)
    setDraft(next)
    setPage(1)
    setFilterOpen(false)
  }

  if (!auth.hasPermission('FollowUp_View')) {
    return (
      <main className="page-shell">
        <p className="state error">{t('forbidden')}</p>
      </main>
    )
  }

  return (
    <main className="page-shell follow-ups-page">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t('title')}</h1>
          <p className="muted">{t('subtitle')}</p>
        </div>
      </section>

      <section className="follow-ups-kpis" aria-label={t('statusFilter')}>
        {summary.map(({ bucket, icon, tone }) => (
          <KpiCard
            key={bucket}
            label={t(bucket)}
            value={followUps.filter((item) => item.bucket === bucket).length}
            icon={icon}
            tone={tone}
            pressed={filters.bucket === bucket}
            onClick={() =>
              applyFilters({
                ...filters,
                bucket: filters.bucket === bucket ? 'All' : bucket,
              })
            }
          />
        ))}
      </section>

      <section className="panel follow-ups-panel">
        <div className="follow-ups-toolbar">
          <div>
            <h2>{t('listTitle')}</h2>
            <p className="muted">{t('listSubtitle')}</p>
          </div>
          <div className="follow-ups-toolbar-actions">
            <span className="follow-ups-count">
              {filtered.length} {t('results')}
            </span>
            {filterCount > 0 && (
              <button
                className="button secondary"
                type="button"
                onClick={() => applyFilters(emptyFilters)}
              >
                {t('clearFilters')}
              </button>
            )}
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setDraft(filters)
                setFilterOpen(true)
              }}
            >
              <ListFilter size={16} aria-hidden="true" />
              {t('filters')}
              {filterCount ? ` (${filterCount})` : ''}
            </button>
          </div>
        </div>

        {query.isLoading && <p className="state">{t('loading')}</p>}
        {query.isError && <p className="state error">{t('loadError')}</p>}
        {(completeMutation.isError || cancelMutation.isError) && (
          <p className="state error" role="alert">
            {t('actionError')}
          </p>
        )}
        {query.isSuccess && filtered.length === 0 && (
          <p className="state">{t('empty', { bucket: t(filters.bucket) })}</p>
        )}

        {visible.length > 0 && (
          <div className="follow-ups-list">
            {visible.map((item) => (
              <article className="follow-ups-row" key={item.id}>
                <div className="follow-ups-main">
                  <div className="follow-ups-title">
                    <strong>{item.recommendation}</strong>
                    <span className="mono" dir="ltr">
                      {item.id}
                    </span>
                  </div>
                  <Link className="patient-link" to={`/patients/${item.patientId}`}>
                    {item.patientName}
                    <small className="mono" dir="ltr">
                      {item.patientNumber}
                    </small>
                  </Link>
                </div>
                <div className="follow-ups-meta">
                  <small>{t('doctor')}</small>
                  <strong>{item.doctorName}</strong>
                </div>
                <div className="follow-ups-meta">
                  <small>{t('recommendedDate')}</small>
                  <strong dir="auto">
                    {displayDate(item.recommendedDate, i18n.language)}
                  </strong>
                </div>
                <div className="follow-ups-status-actions">
                  <span
                    className={`follow-ups-status follow-ups-status-${item.bucket.toLowerCase()}`}
                  >
                    {item.status === 'Cancelled'
                      ? t('Cancelled')
                      : t(item.bucket as FollowUpBucket, { defaultValue: item.bucket })}
                  </span>
                  {item.status === 'Open' && auth.hasPermission('FollowUp_Manage') && (
                    <div className="follow-ups-row-actions">
                      <button
                        className="button secondary"
                        type="button"
                        disabled={pendingAction}
                        onClick={() => completeMutation.mutate(item.id)}
                      >
                        {t('complete')}
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        disabled={pendingAction}
                        onClick={() => cancelMutation.mutate(item.id)}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        {query.isSuccess && filtered.length > 0 && (
          <TablePagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            labels={{
              rowsPerPage: t('rowsPerPage'),
              previous: t('previousPage'),
              next: t('nextPage'),
              page: t('pageNumber', { page: currentPage, total: totalPages }),
              showing: t('showingRows', {
                first: firstRow,
                last: lastRow,
                total: filtered.length,
              }),
            }}
          />
        )}
      </section>

      <Dialog
        header={t('filters')}
        visible={filterOpen}
        modal
        className="follow-ups-filter-dialog"
        onHide={() => setFilterOpen(false)}
      >
        <div className="follow-ups-filter-fields">
          <label>
            <span>{t('search')}</span>
            <InputText
              className="auran-prime-field"
              value={draft.search}
              placeholder={t('searchPlaceholder')}
              onChange={(event) => setDraft({ ...draft, search: event.target.value })}
            />
          </label>
          <label>
            <span>{t('doctor')}</span>
            <Dropdown
              className="auran-prime-field"
              value={draft.doctorId}
              options={doctors}
              optionLabel="label"
              optionValue="value"
              filter
              panelClassName="auran-prime-panel"
              onChange={(event) =>
                setDraft({ ...draft, doctorId: event.value as string })
              }
            />
          </label>
          <label>
            <span>{t('statusFilter')}</span>
            <Dropdown
              className="auran-prime-field"
              value={draft.bucket}
              options={['All', ...summary.map((item) => item.bucket)].map((value) => ({
                label: t(value as FollowUpBucket),
                value,
              }))}
              optionLabel="label"
              optionValue="value"
              filter
              panelClassName="auran-prime-panel"
              onChange={(event) =>
                setDraft({ ...draft, bucket: event.value as FollowUpBucket })
              }
            />
          </label>
          <div className="follow-ups-filter-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => applyFilters(emptyFilters)}
            >
              {t('clearFilters')}
            </button>
            <button
              className="button primary"
              type="button"
              onClick={() => applyFilters(draft)}
            >
              {t('applyFilters')}
            </button>
          </div>
        </div>
      </Dialog>
    </main>
  )
}
