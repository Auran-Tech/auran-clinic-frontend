import './pendingDocumentation.css'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import {
  ClipboardPenLine,
  FileClock,
  FilePenLine,
  ListFilter,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { KpiCard } from '../../components/ui/KpiCard'
import {
  DataTable,
  TablePagination,
  type DataTableColumn,
} from '../../components/ui/DataTable'
import { useAuth } from '../auth/AuthContext'
import { PendingDocumentationEditor } from './PendingDocumentationEditor'
import { getPendingDocumentation } from './api'
import type { PendingDocumentation } from './types'

type SortField = 'patientName' | 'doctorName' | 'documentationStatus' | 'entryAtUtc'

interface Filters {
  search: string
  doctorId: string
  documentationStatus: string
}

const emptyFilters: Filters = {
  search: '',
  doctorId: '',
  documentationStatus: '',
}

export function PendingDocumentationPage() {
  const { t, i18n } = useTranslation('pendingDocumentation')
  const auth = useAuth()
  const isSuperUser = Boolean(auth.session?.user.isSuperUser)
  const canView = auth.hasPermission('Visit_View')
  const [selected, setSelected] = useState<PendingDocumentation | null>(null)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState<{ field: SortField; descending: boolean }>({
    field: 'entryAtUtc',
    descending: false,
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const query = useQuery({
    queryKey: ['pending-documentation', isSuperUser],
    queryFn: () => getPendingDocumentation(!isSuperUser),
    enabled: canView,
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

  const items = query.data ?? []
  const counts = {
    total: items.length,
    draft: items.filter((item) => item.documentationStatus === 'Draft').length,
    pending: items.filter((item) => item.documentationStatus === 'Pending').length,
    exited: items.filter((item) => Boolean(item.exitAtUtc)).length,
  }
  const activeFilterCount =
    Number(Boolean(filters.search.trim())) +
    Number(Boolean(filters.doctorId)) +
    Number(Boolean(filters.documentationStatus))
  const doctors = [
    { label: t('allDoctors'), value: '' },
    ...Array.from(
      new Map(items.map((item) => [item.doctorId, item.doctorName])).entries(),
    )
      .map(([value, label]) => ({ label, value }))
      .sort((left, right) => left.label.localeCompare(right.label, i18n.language)),
  ]
  const search = filters.search.trim().toLocaleLowerCase()
  const visible = items
    .filter(
      (item) =>
        (!filters.doctorId || item.doctorId === filters.doctorId) &&
        (!filters.documentationStatus ||
          item.documentationStatus === filters.documentationStatus) &&
        (!search ||
          `${item.patientName} ${item.patientNumber} ${item.doctorName}`
            .toLocaleLowerCase()
            .includes(search)),
    )
    .sort((left, right) => {
      const comparison = left[sort.field].localeCompare(right[sort.field], i18n.language)
      return sort.descending ? -comparison : comparison
    })
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const firstRow = visible.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastRow = Math.min(currentPage * pageSize, visible.length)

  function sortBy(field: SortField) {
    setSort((current) => ({
      field,
      descending: current.field === field ? !current.descending : false,
    }))
    setPage(1)
  }

  function sortDirection(field: SortField): DataTableColumn['sortDirection'] {
    return sort.field === field ? (sort.descending ? 'descending' : 'ascending') : 'none'
  }

  const columns: DataTableColumn[] = [
    {
      key: 'patient',
      label: t('patient'),
      sortDirection: sortDirection('patientName'),
      onSort: () => sortBy('patientName'),
    },
    {
      key: 'doctor',
      label: t('doctor'),
      sortDirection: sortDirection('doctorName'),
      onSort: () => sortBy('doctorName'),
    },
    {
      key: 'documentation',
      label: t('documentation'),
      sortDirection: sortDirection('documentationStatus'),
      onSort: () => sortBy('documentationStatus'),
    },
    { key: 'visit', label: t('visit') },
    {
      key: 'started',
      label: t('started'),
      sortDirection: sortDirection('entryAtUtc'),
      onSort: () => sortBy('entryAtUtc'),
    },
    { key: 'actions', label: t('actions') },
  ]

  function timeSinceVisit(entryAtUtc: string) {
    const elapsedHours = Math.max(
      0,
      Math.floor((Date.now() - new Date(entryAtUtc).getTime()) / 3_600_000),
    )

    if (!Number.isFinite(elapsedHours) || elapsedHours < 1) {
      return t('lessThanHour')
    }

    const relativeTime = new Intl.RelativeTimeFormat(i18n.language, {
      numeric: 'always',
    })
    return elapsedHours < 24
      ? relativeTime.format(-elapsedHours, 'hour')
      : relativeTime.format(-Math.floor(elapsedHours / 24), 'day')
  }

  return (
    <main className="page-shell pending-page">
      <header className="pending-header">
        <div className="pending-breadcrumb">
          <span>{t('eyebrow')}</span>
          <span aria-hidden="true">·</span>
          <strong>{t('title')}</strong>
        </div>
        <div className="pending-heading-row">
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </div>
      </header>

      <section
        className="pending-summary"
        aria-label={t('summary')}
        aria-busy={query.isLoading}
      >
        {[
          {
            label: t('totalOutstanding'),
            value: counts.total,
            icon: ClipboardPenLine,
            tone: 'blue',
          },
          {
            label: t('draftNotes'),
            value: counts.draft,
            icon: FilePenLine,
            tone: 'amber',
          },
          {
            label: t('pendingNotes'),
            value: counts.pending,
            icon: FileClock,
            tone: 'violet',
          },
          {
            label: t('exitedVisits'),
            value: counts.exited,
            icon: UsersRound,
            tone: 'teal',
          },
        ].map(({ label, value, icon, tone }) => (
          <KpiCard
            key={label}
            label={label}
            value={query.data ? value : '—'}
            icon={icon}
            tone={tone as 'blue' | 'amber' | 'violet' | 'teal'}
          />
        ))}
      </section>

      <section className="pending-list" aria-label={t('outstandingVisits')}>
        <div className="pending-toolbar">
          <div>
            <h2>{t('outstandingVisits')}</h2>
            <small>
              {t('showingCount', { visible: visible.length, total: items.length })}
            </small>
          </div>
          <div className="pending-filter-actions">
            <button
              type="button"
              className="button secondary"
              disabled={activeFilterCount === 0}
              onClick={() => {
                setFilters(emptyFilters)
                setPage(1)
              }}
            >
              {t('clearFilters')}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setDraft(filters)
                setShowFilters(true)
              }}
            >
              <ListFilter size={15} aria-hidden="true" />
              {t('filters')}
              {activeFilterCount > 0 && (
                <span className="pending-filter-count">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {query.isLoading && (
          <p className="pending-state" role="status">
            {t('loading')}
          </p>
        )}
        {query.isError && (
          <div className="pending-state" role="alert">
            <p>{t('loadError')}</p>
            <button
              type="button"
              className="button secondary"
              onClick={() => query.refetch()}
            >
              {t('retry')}
            </button>
          </div>
        )}
        {query.data && items.length === 0 && (
          <p className="pending-state">{t('empty')}</p>
        )}
        {query.data && items.length > 0 && visible.length === 0 && (
          <p className="pending-state">{t('noMatches')}</p>
        )}

        {query.data && visible.length > 0 && (
          <>
            <DataTable
              columns={columns}
              className="pending-table"
              wrapClassName="pending-table-wrap"
            >
              {pageItems.map((item) => (
                <tr key={item.visitId}>
                  <td>
                    <div className="pending-patient-cell">
                      <span className="pending-patient-icon" aria-hidden="true">
                        <UserRound size={16} />
                      </span>
                      <span>
                        <Link to={`/patients/${item.patientId}`}>{item.patientName}</Link>
                        <small dir="ltr">{item.patientNumber}</small>
                      </span>
                    </div>
                  </td>
                  <td>{item.doctorName}</td>
                  <td>
                    <span
                      className={`pending-status pending-status-${item.documentationStatus.toLowerCase()}`}
                    >
                      {t(item.documentationStatus, {
                        defaultValue: item.documentationStatus,
                      })}
                    </span>
                  </td>
                  <td>{t(item.visitStatus, { defaultValue: item.visitStatus })}</td>
                  <td>
                    <time dateTime={item.entryAtUtc}>
                      {new Date(item.entryAtUtc).toLocaleString(i18n.language)}
                    </time>
                    <small className="pending-visit-age">
                      {timeSinceVisit(item.entryAtUtc)}
                    </small>
                  </td>
                  <td>
                    {auth.hasPermission('Visit_Edit') && (
                      <button
                        type="button"
                        className="button secondary pending-finish-button"
                        onClick={() => setSelected(item)}
                      >
                        <FilePenLine size={14} aria-hidden="true" />
                        {t('finishNote')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={visible.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
              labels={{
                rowsPerPage: t('rowsPerPage'),
                previous: t('previous'),
                next: t('next'),
                page: t('page', { current: currentPage, total: totalPages }),
                showing: t('showingRange', {
                  first: firstRow,
                  last: lastRow,
                  total: visible.length,
                }),
              }}
            />
          </>
        )}
      </section>

      <Dialog
        header={
          selected ? `${t('finishNote')} · ${selected.patientName}` : t('finishNote')
        }
        visible={Boolean(selected)}
        modal
        draggable={false}
        resizable={false}
        className="pending-editor-dialog"
        onHide={() => setSelected(null)}
      >
        {selected && (
          <PendingDocumentationEditor
            key={selected.visitId}
            item={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </Dialog>

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
              onClick={() => setDraft(emptyFilters)}
            >
              {t('clearFilters')}
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => {
                setFilters(draft)
                setPage(1)
                setShowFilters(false)
              }}
            >
              {t('applyFilters')}
            </button>
          </div>
        }
      >
        <div className="auran-filter-fields">
          <label htmlFor="pending-filter-search">
            {t('search')}
            <InputText
              id="pending-filter-search"
              className="auran-prime-field"
              value={draft.search}
              onChange={(event) =>
                setDraft((current) => ({ ...current, search: event.target.value }))
              }
            />
          </label>
          {isSuperUser && (
            <label htmlFor="pending-filter-doctor">
              {t('doctor')}
              <Dropdown
                inputId="pending-filter-doctor"
                className="auran-prime-field"
                panelClassName="auran-prime-panel"
                value={draft.doctorId}
                options={doctors}
                optionLabel="label"
                optionValue="value"
                filter
                onChange={(event) =>
                  setDraft((current) => ({ ...current, doctorId: event.value as string }))
                }
              />
            </label>
          )}
          <label htmlFor="pending-filter-status">
            {t('documentation')}
            <Dropdown
              inputId="pending-filter-status"
              className="auran-prime-field"
              panelClassName="auran-prime-panel"
              value={draft.documentationStatus}
              options={[
                { label: t('allStatuses'), value: '' },
                { label: t('Draft'), value: 'Draft' },
                { label: t('Pending'), value: 'Pending' },
              ]}
              optionLabel="label"
              optionValue="value"
              filter
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  documentationStatus: event.value as string,
                }))
              }
            />
          </label>
        </div>
      </Dialog>
    </main>
  )
}
