import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getEmployees } from '../employees/api'
import { searchAuditLogs } from './api'
import type { AuditLogQuery } from './types'

export function AuditPage() {
  const auth = useAuth()
  const { t } = useTranslation()
  const canView = auth.hasPermission('Audit_View')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [actorUserId, setActorUserId] = useState('')
  const [fromLocal, setFromLocal] = useState('')
  const [toLocal, setToLocal] = useState('')
  const [take, setTake] = useState(100)

  const query = useMemo<AuditLogQuery>(() => ({
    take,
    action: action.trim() || undefined,
    entityType: entityType.trim() || undefined,
    actorUserId: actorUserId || undefined,
    fromUtc: fromLocal ? new Date(fromLocal).toISOString() : undefined,
    toUtc: toLocal ? new Date(toLocal).toISOString() : undefined,
  }), [take, action, entityType, actorUserId, fromLocal, toLocal])

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

  if (!canView) {
    return (
      <main className="page-shell">
        <p className="state error">{t('auditPage.denied')}</p>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('auditPage.eyebrow')}</p>
          <h1>{t('auditPage.title')}</h1>
          <p className="muted">{t('auditPage.intro')}</p>
        </div>
        <div className="actions">
          {auth.hasPermission('Reports_View') && (
            <Link className="button secondary nav-button" to="/reports">{t('common.dashboard')}</Link>
          )}
          {auth.hasPermission('Settings_View') && (
            <Link className="button secondary nav-button" to="/settings">{t('common.settings')}</Link>
          )}
          {(auth.hasPermission('Users_View') || auth.hasPermission('RBAC_View')) && (
            <Link className="button secondary nav-button" to="/employees">{t('common.employees')}</Link>
          )}
          <Link className="button secondary nav-button" to="/patients">{t('common.patients')}</Link>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t('auditPage.searchTitle')}</h2>
            <p className="muted">{t('auditPage.searchIntro')}</p>
          </div>
        </div>

        <div className="audit-filters">
          <label>
            <span>{t('auditPage.action')}</span>
            <input
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder={t('auditPage.actionPlaceholder')}
            />
          </label>

          <label>
            <span>{t('auditPage.entityType')}</span>
            <input
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              placeholder={t('auditPage.entityPlaceholder')}
            />
          </label>

          {auth.hasPermission('Users_View') && (
            <label>
              <span>{t('auditPage.actor')}</span>
              <select value={actorUserId} onChange={(event) => setActorUserId(event.target.value)}>
                <option value="">{t('auditPage.allActors')}</option>
                {(employeesQuery.data ?? []).map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            <span>{t('auditPage.from')}</span>
            <input
              type="datetime-local"
              value={fromLocal}
              onChange={(event) => setFromLocal(event.target.value)}
            />
          </label>

          <label>
            <span>{t('auditPage.to')}</span>
            <input
              type="datetime-local"
              value={toLocal}
              onChange={(event) => setToLocal(event.target.value)}
            />
          </label>

          <label>
            <span>{t('auditPage.rows')}</span>
            <select value={take} onChange={(event) => setTake(Number(event.target.value))}>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </label>

          <div className="actions audit-filter-actions">
            <button
              className="button secondary"
              onClick={() => {
                setAction('')
                setEntityType('')
                setActorUserId('')
                setFromLocal('')
                setToLocal('')
                setTake(100)
              }}
            >
              {t('auditPage.clear')}
            </button>
          </div>
        </div>

        {logsQuery.isLoading && <p className="state">{t('auditPage.loading')}</p>}
        {logsQuery.isError && <p className="state error">{t('auditPage.loadError')}</p>}

        {logsQuery.data?.length === 0 && (
          <p className="state">{t('auditPage.empty')}</p>
        )}

        {logsQuery.data && logsQuery.data.length > 0 && (
          <div className="audit-list">
            {logsQuery.data.map((log) => (
              <article className="audit-card" key={log.id}>
                <div className="audit-card-heading">
                  <div>
                    <strong>{log.action}</strong>
                    <p className="muted">
                      {log.entityType}{log.entityId ? ` · ${log.entityId}` : ''}
                    </p>
                  </div>
                  <time dateTime={log.occurredAtUtc}>
                    {new Date(log.occurredAtUtc).toLocaleString()}
                  </time>
                </div>

                <dl className="audit-meta">
                  <div>
                    <dt>{t('auditPage.actor')}</dt>
                    <dd>{log.actorName}</dd>
                  </div>
                  <div>
                    <dt>{t('auditPage.ip')}</dt>
                    <dd className="mono">{log.ipAddress ?? '—'}</dd>
                  </div>
                </dl>

                {log.metadataJson && (
                  <details>
                    <summary>{t('auditPage.metadata')}</summary>
                    <pre className="audit-json">{formatMetadata(log.metadataJson)}</pre>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function formatMetadata(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}
