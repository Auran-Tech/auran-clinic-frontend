import './visitsPage.css'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Activity, CircleCheck, FileClock, ListFilter } from 'lucide-react'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import {
  DataTable,
  TablePagination,
  type DataTableColumn,
} from '../../components/ui/DataTable'
import { KpiCard } from '../../components/ui/KpiCard'
import { useAuth } from '../auth/AuthContext'
import { getClinicVisitDoctors, getClinicVisits } from './api'
import type { ClinicVisitListQuery } from './types'

type VisitFilters = Pick<
  ClinicVisitListQuery,
  'search' | 'doctorId' | 'status' | 'documentationStatus'
> & { fromDate: string; toDate: string }

const emptyFilters: VisitFilters = {
  search: '',
  doctorId: '',
  status: undefined,
  documentationStatus: undefined,
  fromDate: '',
  toDate: '',
}

const statusKeys = ['Open', 'Completed', 'Cancelled'] as const
const documentationKeys = ['NotStarted', 'Draft', 'Pending', 'Completed'] as const

export function VisitsPage() {
  const { t, i18n } = useTranslation('visits')
  const auth = useAuth()
  const [filters, setFilters] = useState<VisitFilters>(emptyFilters)
  const [draft, setDraft] = useState<VisitFilters>(emptyFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortBy, setSortBy] = useState<ClinicVisitListQuery['sortBy']>('entryAtUtc')
  const [descending, setDescending] = useState(true)
  const canView = auth.hasPermission('Visit_View')

  const fromUtc = filters.fromDate
    ? new Date(`${filters.fromDate}T00:00:00`).toISOString()
    : undefined
  const toUtc = filters.toDate
    ? new Date(`${filters.toDate}T23:59:59.999`).toISOString()
    : undefined
  const query: ClinicVisitListQuery = {
    page,
    pageSize,
    search: filters.search?.trim() || undefined,
    doctorId: filters.doctorId || undefined,
    status: filters.status,
    documentationStatus: filters.documentationStatus,
    fromUtc,
    toUtc,
    sortBy,
    descending,
  }
  const visitsQuery = useQuery({
    queryKey: ['clinic-visits', query],
    queryFn: () => getClinicVisits(query),
    enabled: canView,
  })
  const doctorsQuery = useQuery({
    queryKey: ['clinic-visit-doctors'],
    queryFn: getClinicVisitDoctors,
    enabled: canView,
  })

  const result = visitsQuery.data
  const items = result?.visits.data ?? []
  const total = result?.visits.setting.totalCount ?? 0
  const totalPages = result?.visits.setting.totalPage ?? 1
  const filterCount =
    Number(Boolean(filters.search?.trim())) +
    Number(Boolean(filters.doctorId)) +
    Number(Boolean(filters.status)) +
    Number(Boolean(filters.documentationStatus)) +
    Number(Boolean(filters.fromDate)) +
    Number(Boolean(filters.toDate))
  const columns: DataTableColumn[] = [
    { key: 'visitId', label: t('visitId') },
    { key: 'patientName', label: t('patient') },
    { key: 'doctorName', label: t('doctor') },
    { key: 'status', label: t('status') },
    { key: 'documentationStatus', label: t('documentationStatus') },
    { key: 'entryAtUtc', label: t('started') },
    { key: 'action', label: t('action') },
  ].map((column) => {
    if (!['patientName', 'doctorName', 'status', 'entryAtUtc'].includes(column.key)) {
      return column
    }
    const key = column.key as ClinicVisitListQuery['sortBy']
    return {
      ...column,
      sortDirection: sortBy === key ? (descending ? 'descending' : 'ascending') : 'none',
      onSort: () => {
        setDescending(sortBy === key ? !descending : key === 'entryAtUtc')
        setSortBy(key)
        setPage(1)
      },
    }
  })

  function applyFilters(next: VisitFilters) {
    setFilters(next)
    setDraft(next)
    setPage(1)
    setFiltersOpen(false)
  }

  if (!canView) {
    return (
      <main className="page-shell">
        <p className="state error">{t('forbidden')}</p>
      </main>
    )
  }

  return (
    <main className="page-shell visits-page">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t('title')}</h1>
          <p className="muted">{t('subtitle')}</p>
        </div>
      </section>

      <section className="visits-kpis" aria-label={t('summary')}>
        <KpiCard
          label={t('activeVisits')}
          value={result?.summary.active ?? 0}
          icon={Activity}
          tone="blue"
        />
        <KpiCard
          label={t('completedVisits')}
          value={result?.summary.completed ?? 0}
          icon={CircleCheck}
          tone="teal"
        />
        <KpiCard
          label={t('pendingDocs')}
          value={result?.summary.pendingDocumentation ?? 0}
          icon={FileClock}
          tone="amber"
          to={auth.hasPermission('Visit_View') ? '/pending-documentation' : undefined}
        />
      </section>

      <section className="panel visits-panel">
        <div className="visits-toolbar">
          <div>
            <h2>{t('listTitle')}</h2>
            <p className="muted">{t('listSubtitle')}</p>
          </div>
          <div className="visits-toolbar-actions">
            <span className="visits-count">
              {total} {t('visitsCount')}
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
                setFiltersOpen(true)
              }}
            >
              <ListFilter size={16} aria-hidden="true" />
              {t('filters')}
              {filterCount ? ` (${filterCount})` : ''}
            </button>
          </div>
        </div>

        {visitsQuery.isLoading && <p className="state">{t('loadingList')}</p>}
        {visitsQuery.isError && <p className="state error">{t('loadListError')}</p>}
        {visitsQuery.isSuccess && items.length === 0 && (
          <p className="state">{t('emptyList')}</p>
        )}
        {items.length > 0 && (
          <DataTable columns={columns} className="visits-table">
            {items.map((visit) => (
              <tr key={visit.visitId}>
                <td className="mono" dir="ltr">
                  {visit.visitId.slice(0, 8)}
                </td>
                <td>
                  <Link className="patient-link" to={`/patients/${visit.patientId}`}>
                    <strong>{visit.patientName}</strong>
                  </Link>
                  <small className="mono" dir="ltr">
                    {visit.patientNumber}
                  </small>
                </td>
                <td>{visit.doctorName}</td>
                <td>
                  <span
                    className={`visits-badge visits-badge-${visit.status.toLowerCase()}`}
                  >
                    {t(visit.status as 'Open', { defaultValue: visit.status })}
                  </span>
                </td>
                <td>
                  <span
                    className={`visits-badge visits-badge-${visit.documentationStatus.toLowerCase()}`}
                  >
                    {t(visit.documentationStatus as 'Draft', {
                      defaultValue: visit.documentationStatus,
                    })}
                  </span>
                </td>
                <td>
                  <time dateTime={visit.entryAtUtc}>
                    {new Date(visit.entryAtUtc).toLocaleString(i18n.language)}
                  </time>
                </td>
                <td>
                  <Link
                    className="button secondary nav-button"
                    to={`/patients/${visit.patientId}`}
                  >
                    {t('open')}
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        {visitsQuery.isSuccess && total > 0 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
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
              page: t('pageNumber', { page, total: totalPages }),
              showing: t('showingRows', {
                first: (page - 1) * pageSize + 1,
                last: Math.min(page * pageSize, total),
                total,
              }),
            }}
          />
        )}
      </section>

      <Dialog
        header={t('filters')}
        visible={filtersOpen}
        modal
        className="visits-filter-dialog"
        onHide={() => setFiltersOpen(false)}
      >
        <div className="visits-filter-fields">
          <label>
            <span>{t('search')}</span>
            <InputText
              className="auran-prime-field"
              value={draft.search ?? ''}
              placeholder={t('searchPlaceholder')}
              onChange={(event) => setDraft({ ...draft, search: event.target.value })}
            />
          </label>
          <label>
            <span>{t('doctor')}</span>
            <Dropdown
              className="auran-prime-field"
              value={draft.doctorId ?? ''}
              options={[
                { label: t('allDoctors'), value: '' },
                ...(doctorsQuery.data ?? []).map((doctor) => ({
                  label: doctor.fullName,
                  value: doctor.id,
                })),
              ]}
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
            <span>{t('status')}</span>
            <Dropdown
              className="auran-prime-field"
              value={draft.status ?? ''}
              options={[
                { label: t('allStatuses'), value: '' },
                ...statusKeys.map((key) => ({ label: t(key), value: key })),
              ]}
              optionLabel="label"
              optionValue="value"
              filter
              panelClassName="auran-prime-panel"
              onChange={(event) =>
                setDraft({ ...draft, status: event.value || undefined })
              }
            />
          </label>
          <label>
            <span>{t('documentationStatus')}</span>
            <Dropdown
              className="auran-prime-field"
              value={draft.documentationStatus ?? ''}
              options={[
                { label: t('allStatuses'), value: '' },
                ...documentationKeys.map((key) => ({ label: t(key), value: key })),
              ]}
              optionLabel="label"
              optionValue="value"
              filter
              panelClassName="auran-prime-panel"
              onChange={(event) =>
                setDraft({
                  ...draft,
                  documentationStatus: event.value || undefined,
                })
              }
            />
          </label>
          <label>
            <span>{t('fromDate')}</span>
            <InputText
              className="auran-prime-field"
              type="date"
              value={draft.fromDate}
              onChange={(event) => setDraft({ ...draft, fromDate: event.target.value })}
            />
          </label>
          <label>
            <span>{t('toDate')}</span>
            <InputText
              className="auran-prime-field"
              type="date"
              value={draft.toDate}
              onChange={(event) => setDraft({ ...draft, toDate: event.target.value })}
            />
          </label>
          <div className="visits-filter-actions">
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
