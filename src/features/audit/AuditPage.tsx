import './audit.css'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, ListFilter, UsersRound } from 'lucide-react'
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
import { getEmployees } from '../employees/api'
import { searchAuditLogs } from './api'
import type { AuditLogItem, AuditLogQuery } from './types'

interface AuditFilters {
  action: string
  entityType: string
  actorUserId: string
  fromLocal: string
  toLocal: string
  take: number
}

const emptyFilters: AuditFilters = {
  action: '',
  entityType: '',
  actorUserId: '',
  fromLocal: '',
  toLocal: '',
  take: 100,
}

type SortKey = 'occurredAtUtc' | 'action' | 'entityType' | 'actorName'

function formatMetadata(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

export function AuditPage() {
  const { t, i18n } = useTranslation('audit')
  const auth = useAuth()
  const canView = auth.hasPermission('Audit_View')
  const [filters, setFilters] = useState<AuditFilters>(emptyFilters)
  const [draft, setDraft] = useState<AuditFilters>(emptyFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortKey, setSortKey] = useState<SortKey>('occurredAtUtc')
  const [descending, setDescending] = useState(true)

  const query: AuditLogQuery = {
    take: filters.take,
    action: filters.action.trim() || undefined,
    entityType: filters.entityType.trim() || undefined,
    actorUserId: filters.actorUserId || undefined,
    fromUtc: filters.fromLocal ? new Date(filters.fromLocal).toISOString() : undefined,
    toUtc: filters.toLocal ? new Date(filters.toLocal).toISOString() : undefined,
  }
  const logsQuery = useQuery({
    queryKey: ['audit-search', query],
    queryFn: () => searchAuditLogs(query),
    enabled: canView,
  })
  const employeesQuery = useQuery({
    queryKey: ['employees', 'audit-filter'],
    queryFn: getEmployees,
    enabled: canView && auth.hasPermission('Users_View'),
  })

  const logs = logsQuery.data ?? []
  const sorted = [...logs].sort((a, b) => {
    const comparison = a[sortKey].localeCompare(b[sortKey], i18n.language)
    return descending ? -comparison : comparison
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visible = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const activeFilterCount =
    Number(Boolean(filters.action.trim())) +
    Number(Boolean(filters.entityType.trim())) +
    Number(Boolean(filters.actorUserId)) +
    Number(Boolean(filters.fromLocal)) +
    Number(Boolean(filters.toLocal))
  const columns: DataTableColumn[] = [
    { key: 'occurredAtUtc', label: t('time') },
    { key: 'action', label: t('action') },
    { key: 'entityType', label: t('entityType') },
    { key: 'actorName', label: t('actor') },
    { key: 'ipAddress', label: 'IP' },
  ].map((column) => {
    if (column.key === 'ipAddress') return column
    const key = column.key as SortKey
    return {
      ...column,
      sortDirection: sortKey === key ? (descending ? 'descending' : 'ascending') : 'none',
      onSort: () => {
        setDescending(sortKey === key ? !descending : key === 'occurredAtUtc')
        setSortKey(key)
        setPage(1)
      },
    }
  })

  function applyFilters(next: AuditFilters) {
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
    <main className="page-shell audit-page">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t('title')}</h1>
          <p className="muted">{t('subtitle')}</p>
        </div>
      </section>

      <section className="audit-kpis" aria-label={t('summary')}>
        <KpiCard
          label={t('totalEvents')}
          value={logs.length}
          icon={Activity}
          tone="blue"
        />
        <KpiCard
          label={t('uniqueActors')}
          value={new Set(logs.map((log) => log.actorUserId)).size}
          icon={UsersRound}
          tone="teal"
        />
      </section>

      <section className="panel audit-panel">
        <div className="audit-toolbar">
          <div>
            <h2>{t('searchTitle')}</h2>
            <p className="muted">{t('searchSubtitle')}</p>
          </div>
          <div className="audit-toolbar-actions">
            <span className="audit-count">
              {logs.length} {t('events')}
            </span>
            {activeFilterCount > 0 && (
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
              {activeFilterCount ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
        </div>

        {logsQuery.isLoading && <p className="state">{t('loading')}</p>}
        {logsQuery.isError && <p className="state error">{t('loadError')}</p>}
        {logsQuery.isSuccess && logs.length === 0 && (
          <p className="state">{t('empty')}</p>
        )}
        {visible.length > 0 && (
          <DataTable columns={columns} className="audit-table">
            {visible.map((log: AuditLogItem) => (
              <tr key={log.id}>
                <td>
                  <time dateTime={log.occurredAtUtc}>
                    {new Date(log.occurredAtUtc).toLocaleString(i18n.language)}
                  </time>
                </td>
                <td>
                  <strong className="audit-event-label">
                    <span aria-hidden="true" />
                    {log.action}
                  </strong>
                  {log.metadataJson && (
                    <details className="audit-details">
                      <summary>{t('metadata')}</summary>
                      <pre className="audit-json">{formatMetadata(log.metadataJson)}</pre>
                    </details>
                  )}
                </td>
                <td>
                  <strong>{log.entityType}</strong>
                  {log.entityId && (
                    <small className="mono" dir="ltr">
                      {log.entityId}
                    </small>
                  )}
                </td>
                <td>{log.actorName}</td>
                <td className="mono" dir="ltr">
                  {log.ipAddress ?? '—'}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        {logsQuery.isSuccess && logs.length > 0 && (
          <TablePagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={logs.length}
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
                first: (currentPage - 1) * pageSize + 1,
                last: Math.min(currentPage * pageSize, logs.length),
                total: logs.length,
              }),
            }}
          />
        )}
      </section>

      <Dialog
        header={t('filters')}
        visible={filtersOpen}
        modal
        className="audit-filter-dialog"
        onHide={() => setFiltersOpen(false)}
      >
        <div className="audit-filter-fields">
          <label>
            <span>{t('action')}</span>
            <InputText
              className="auran-prime-field"
              value={draft.action}
              placeholder={t('actionExample')}
              onChange={(event) => setDraft({ ...draft, action: event.target.value })}
            />
          </label>
          <label>
            <span>{t('entityType')}</span>
            <InputText
              className="auran-prime-field"
              value={draft.entityType}
              placeholder={t('entityExample')}
              onChange={(event) => setDraft({ ...draft, entityType: event.target.value })}
            />
          </label>
          {auth.hasPermission('Users_View') && (
            <label>
              <span>{t('actor')}</span>
              <Dropdown
                className="auran-prime-field"
                value={draft.actorUserId}
                options={[
                  { label: t('allActors'), value: '' },
                  ...(employeesQuery.data ?? []).map((employee) => ({
                    label: employee.fullName,
                    value: employee.id,
                  })),
                ]}
                optionLabel="label"
                optionValue="value"
                filter
                panelClassName="auran-prime-panel"
                onChange={(event) =>
                  setDraft({ ...draft, actorUserId: event.value as string })
                }
              />
            </label>
          )}
          <label>
            <span>{t('from')}</span>
            <InputText
              className="auran-prime-field"
              type="datetime-local"
              value={draft.fromLocal}
              onChange={(event) => setDraft({ ...draft, fromLocal: event.target.value })}
            />
          </label>
          <label>
            <span>{t('to')}</span>
            <InputText
              className="auran-prime-field"
              type="datetime-local"
              value={draft.toLocal}
              onChange={(event) => setDraft({ ...draft, toLocal: event.target.value })}
            />
          </label>
          <label>
            <span>{t('rows')}</span>
            <Dropdown
              className="auran-prime-field"
              value={draft.take}
              options={[50, 100, 200].map((value) => ({ label: String(value), value }))}
              optionLabel="label"
              optionValue="value"
              filter
              panelClassName="auran-prime-panel"
              onChange={(event) => setDraft({ ...draft, take: Number(event.value) })}
            />
          </label>
          <div className="audit-filter-buttons">
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
