import './workflow.css'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  createWorkflowStatus,
  deleteWorkflowStatus,
  getWorkflowConfiguration,
  replaceWorkflowTransitions,
  updateWorkflowStatus,
} from './api'
import type { WorkflowStatus, WorkflowStatusInput } from './types'

const emptyStatus: WorkflowStatusInput = {
  code: '',
  name: '',
  color: '#64748b',
  sortOrder: 0,
  isSystemFinal: false,
}

export function WorkflowConfigurationPanel() {
  const { t } = useTranslation('workflow')
  const auth = useAuth()
  const queryClient = useQueryClient()
  const canView = auth.hasPermission('Settings_View')
  const canManage = auth.hasPermission('Settings_Manage')

  const query = useQuery({
    queryKey: ['workflow-config'],
    queryFn: getWorkflowConfiguration,
    enabled: canView,
  })

  const [newStatus, setNewStatus] = useState<WorkflowStatusInput>(emptyStatus)
  const [editing, setEditing] = useState<WorkflowStatus | null>(null)
  const [editForm, setEditForm] = useState<WorkflowStatusInput>(emptyStatus)
  const [transitionPairs, setTransitionPairs] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!query.data) return
    setTransitionPairs(
      new Set(
        query.data.transitions.map(
          (transition) => `${transition.fromStatusId}:${transition.toStatusId}`,
        ),
      ),
    )
  }, [query.data])

  useEffect(() => {
    if (!editing) return
    setEditForm({
      code: editing.code,
      name: editing.name,
      color: editing.color,
      sortOrder: editing.sortOrder,
      isSystemFinal: editing.isSystemFinal,
    })
  }, [editing])

  const sortedStatuses = useMemo(
    () =>
      [...(query.data?.statuses ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
    [query.data?.statuses],
  )

  const syncConfiguration = (
    data: Awaited<ReturnType<typeof getWorkflowConfiguration>>,
  ) => {
    queryClient.setQueryData(['workflow-config'], data)
  }

  const createMutation = useMutation({
    mutationFn: () => createWorkflowStatus(newStatus),
    onSuccess: (data) => {
      syncConfiguration(data)
      setNewStatus(emptyStatus)
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('No workflow status selected.')
      return updateWorkflowStatus(editing.id, editForm)
    },
    onSuccess: (data) => {
      syncConfiguration(data)
      setEditing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWorkflowStatus,
    onSuccess: syncConfiguration,
  })

  const transitionMutation = useMutation({
    mutationFn: () =>
      replaceWorkflowTransitions(
        [...transitionPairs].map((pair) => {
          const [fromStatusId, toStatusId] = pair.split(':')
          return { fromStatusId, toStatusId }
        }),
      ),
    onSuccess: syncConfiguration,
  })

  if (!canView) return null

  const validStatus = (input: WorkflowStatusInput) =>
    Boolean(
      input.code.trim() &&
      input.name.trim() &&
      /^#[0-9A-Fa-f]{6}$/.test(input.color) &&
      input.sortOrder >= 0,
    )

  const toggleTransition = (fromStatusId: string, toStatusId: string) => {
    const key = `${fromStatusId}:${toStatusId}`
    setTransitionPairs((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t('title')}</h2>
          <p className="muted">{t('subtitle')}</p>
        </div>
      </div>

      {query.isLoading && <p className="state">{t('loading')}</p>}
      {query.isError && <p className="state error">{t('loadError')}</p>}

      {query.data && (
        <>
          {canManage && (
            <div className="workflow-status-form">
              <label>
                <span>{t('code')}</span>
                <input
                  value={newStatus.code}
                  onChange={(event) =>
                    setNewStatus((current) => ({ ...current, code: event.target.value }))
                  }
                  placeholder="WAITING"
                />
              </label>
              <label>
                <span>{t('name')}</span>
                <input
                  value={newStatus.name}
                  onChange={(event) =>
                    setNewStatus((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder={t('stageNameExample')}
                />
              </label>
              <label>
                <span>{t('color')}</span>
                <input
                  value={newStatus.color}
                  onChange={(event) =>
                    setNewStatus((current) => ({ ...current, color: event.target.value }))
                  }
                  placeholder="#64748b"
                />
              </label>
              <label>
                <span>{t('sortOrder')}</span>
                <input
                  type="number"
                  min="0"
                  value={newStatus.sortOrder}
                  onChange={(event) =>
                    setNewStatus((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="inline-toggle">
                <input
                  type="checkbox"
                  checked={newStatus.isSystemFinal}
                  onChange={(event) =>
                    setNewStatus((current) => ({
                      ...current,
                      isSystemFinal: event.target.checked,
                    }))
                  }
                />
                <span>{t('finalExitStage')}</span>
              </label>
              <div className="actions">
                <button
                  className="button primary"
                  disabled={!validStatus(newStatus) || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending ? t('adding') : t('addStage')}
                </button>
              </div>
            </div>
          )}

          <div className="workflow-status-list">
            {sortedStatuses.map((status) => (
              <article className="workflow-status-card" key={status.id}>
                <div className="workflow-status-main">
                  <span
                    className="workflow-color"
                    style={{ backgroundColor: status.color }}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>{status.name}</strong>
                    <div className="muted mono">{status.code}</div>
                  </div>
                </div>

                <div className="workflow-status-meta">
                  <span>{t('orderValue', { order: status.sortOrder })}</span>
                  {status.isSystemFinal && (
                    <span className="role-badge">{t('final')}</span>
                  )}
                  {status.isInUse && <span className="role-badge">{t('inUse')}</span>}
                </div>

                {canManage && (
                  <div className="actions">
                    <button
                      className="button secondary"
                      onClick={() => setEditing(status)}
                    >
                      {t('edit')}
                    </button>
                    <button
                      className="button danger"
                      disabled={
                        status.isSystemFinal || status.isInUse || deleteMutation.isPending
                      }
                      onClick={() => deleteMutation.mutate(status.id)}
                    >
                      {t('delete')}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          {editing && canManage && (
            <div className="workflow-edit-box">
              <div className="panel-heading">
                <div>
                  <h3>{t('editStage', { name: editing.name })}</h3>
                  <p className="muted">{t('editSubtitle')}</p>
                </div>
                <button className="button secondary" onClick={() => setEditing(null)}>
                  {t('close')}
                </button>
              </div>

              <div className="workflow-status-form">
                <label>
                  <span>{t('code')}</span>
                  <input
                    value={editForm.code}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, code: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>{t('name')}</span>
                  <input
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>{t('color')}</span>
                  <input
                    value={editForm.color}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        color: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>{t('sortOrder')}</span>
                  <input
                    type="number"
                    min="0"
                    value={editForm.sortOrder}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        sortOrder: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={editForm.isSystemFinal}
                    disabled={editing.isSystemFinal}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        isSystemFinal: event.target.checked,
                      }))
                    }
                  />
                  <span>{t('finalExitStage')}</span>
                </label>
                <div className="actions">
                  <button
                    className="button primary"
                    disabled={!validStatus(editForm) || updateMutation.isPending}
                    onClick={() => updateMutation.mutate()}
                  >
                    {updateMutation.isPending ? t('saving') : t('saveStage')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="workflow-transition-section">
            <div className="panel-heading">
              <div>
                <h3>{t('transitionsTitle')}</h3>
                <p className="muted">{t('transitionsSubtitle')}</p>
              </div>
              {canManage && (
                <button
                  className="button primary"
                  disabled={transitionMutation.isPending}
                  onClick={() => transitionMutation.mutate()}
                >
                  {transitionMutation.isPending ? t('saving') : t('saveTransitions')}
                </button>
              )}
            </div>

            <div className="workflow-matrix-wrap">
              <table className="workflow-matrix">
                <thead>
                  <tr>
                    <th>{t('fromTo')}</th>
                    {sortedStatuses.map((status) => (
                      <th key={status.id}>{status.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedStatuses.map((fromStatus) => (
                    <tr key={fromStatus.id}>
                      <th>{fromStatus.name}</th>
                      {sortedStatuses.map((toStatus) => {
                        const disabled = fromStatus.id === toStatus.id || !canManage
                        const checked = transitionPairs.has(
                          `${fromStatus.id}:${toStatus.id}`,
                        )

                        return (
                          <td key={toStatus.id}>
                            <input
                              type="checkbox"
                              aria-label={t('transitionLabel', {
                                from: fromStatus.name,
                                to: toStatus.name,
                              })}
                              disabled={disabled}
                              checked={checked}
                              onChange={() =>
                                toggleTransition(fromStatus.id, toStatus.id)
                              }
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(createMutation.isError ||
            updateMutation.isError ||
            deleteMutation.isError ||
            transitionMutation.isError) && (
            <p className="field-error">{t('changeError')}</p>
          )}
        </>
      )}
    </section>
  )
}
