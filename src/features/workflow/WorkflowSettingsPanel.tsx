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

export function WorkflowSettingsPanel() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const canView = auth.hasPermission('Settings_View')
  const canManage = auth.hasPermission('Settings_Manage')

  const query = useQuery({
    queryKey: ['workflow-config'],
    queryFn: getWorkflowConfiguration,
    enabled: canView,
  })

  const [createDraft, setCreateDraft] = useState<WorkflowStatusInput>(emptyStatus)
  const [statusDrafts, setStatusDrafts] = useState<Record<string, WorkflowStatusInput>>({})
  const [transitionKeys, setTransitionKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!query.data) return

    const nextDrafts: Record<string, WorkflowStatusInput> = {}
    for (const status of query.data.statuses) {
      nextDrafts[status.id] = toStatusInput(status)
    }
    setStatusDrafts(nextDrafts)

    setTransitionKeys(
      new Set(
        query.data.transitions.map(
          (transition) => transitionKey(transition.fromStatusId, transition.toStatusId),
        ),
      ),
    )
  }, [query.data])

  const syncConfiguration = (configuration: Awaited<ReturnType<typeof getWorkflowConfiguration>>) => {
    queryClient.setQueryData(['workflow-config'], configuration)
  }

  const createMutation = useMutation({
    mutationFn: createWorkflowStatus,
    onSuccess: (configuration) => {
      syncConfiguration(configuration)
      setCreateDraft(emptyStatus)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: WorkflowStatusInput }) =>
      updateWorkflowStatus(id, input),
    onSuccess: syncConfiguration,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWorkflowStatus,
    onSuccess: syncConfiguration,
  })

  const transitionsMutation = useMutation({
    mutationFn: () =>
      replaceWorkflowTransitions(
        Array.from(transitionKeys).map((key) => {
          const [fromStatusId, toStatusId] = key.split('>')
          return { fromStatusId, toStatusId }
        }),
      ),
    onSuccess: syncConfiguration,
  })

  const orderedStatuses = useMemo(
    () => [...(query.data?.statuses ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    ),
    [query.data?.statuses],
  )

  if (!canView) return null

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Clinic workflow</h2>
          <p className="muted">
            Configure queue stages and the transitions staff are allowed to perform.
          </p>
        </div>
      </div>

      {query.isLoading && <p className="state">Loading workflow configuration…</p>}
      {query.isError && <p className="state error">Unable to load workflow configuration.</p>}

      {query.data && (
        <>
          <div className="workflow-status-list">
            {orderedStatuses.map((status) => {
              const draft = statusDrafts[status.id] ?? toStatusInput(status)

              return (
                <article className="workflow-status-card" key={status.id}>
                  <div className="workflow-status-marker" style={{ background: draft.color }} />

                  <label>
                    <span>Code</span>
                    <input
                      value={draft.code}
                      disabled={!canManage}
                      onChange={(event) =>
                        setStatusDrafts((current) => ({
                          ...current,
                          [status.id]: { ...draft, code: event.target.value },
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>Name</span>
                    <input
                      value={draft.name}
                      disabled={!canManage}
                      onChange={(event) =>
                        setStatusDrafts((current) => ({
                          ...current,
                          [status.id]: { ...draft, name: event.target.value },
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>Color</span>
                    <input
                      type="color"
                      value={draft.color}
                      disabled={!canManage}
                      onChange={(event) =>
                        setStatusDrafts((current) => ({
                          ...current,
                          [status.id]: { ...draft, color: event.target.value },
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>Order</span>
                    <input
                      type="number"
                      min="0"
                      value={draft.sortOrder}
                      disabled={!canManage}
                      onChange={(event) =>
                        setStatusDrafts((current) => ({
                          ...current,
                          [status.id]: { ...draft, sortOrder: Number(event.target.value) },
                        }))
                      }
                    />
                  </label>

                  <label className="inline-toggle workflow-final-toggle">
                    <input
                      type="checkbox"
                      checked={draft.isSystemFinal}
                      disabled={!canManage || status.isSystemFinal}
                      onChange={(event) =>
                        setStatusDrafts((current) => ({
                          ...current,
                          [status.id]: { ...draft, isSystemFinal: event.target.checked },
                        }))
                      }
                    />
                    <span>Final stage</span>
                  </label>

                  <div className="workflow-status-meta">
                    {status.isInUse && <span className="role-badge">In use</span>}
                    {status.isSystemFinal && <span className="role-badge">Current final</span>}
                  </div>

                  {canManage && (
                    <div className="actions workflow-status-actions">
                      <button
                        className="button secondary"
                        disabled={updateMutation.isPending || !isValidStatusDraft(draft)}
                        onClick={() => updateMutation.mutate({ id: status.id, input: draft })}
                      >
                        Save
                      </button>
                      <button
                        className="button danger"
                        disabled={
                          deleteMutation.isPending ||
                          status.isInUse ||
                          status.isSystemFinal
                        }
                        onClick={() => deleteMutation.mutate(status.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          {canManage && (
            <section className="workflow-create">
              <h3>Add stage</h3>
              <div className="workflow-create-grid">
                <label>
                  <span>Code</span>
                  <input
                    value={createDraft.code}
                    onChange={(event) =>
                      setCreateDraft((current) => ({ ...current, code: event.target.value }))
                    }
                    placeholder="OBSERVATION"
                  />
                </label>
                <label>
                  <span>Name</span>
                  <input
                    value={createDraft.name}
                    onChange={(event) =>
                      setCreateDraft((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Observation"
                  />
                </label>
                <label>
                  <span>Color</span>
                  <input
                    type="color"
                    value={createDraft.color}
                    onChange={(event) =>
                      setCreateDraft((current) => ({ ...current, color: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Order</span>
                  <input
                    type="number"
                    min="0"
                    value={createDraft.sortOrder}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        sortOrder: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={createDraft.isSystemFinal}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        isSystemFinal: event.target.checked,
                      }))
                    }
                  />
                  <span>Make final stage</span>
                </label>
                <div className="actions">
                  <button
                    className="button primary"
                    disabled={createMutation.isPending || !isValidStatusDraft(createDraft)}
                    onClick={() => createMutation.mutate(createDraft)}
                  >
                    {createMutation.isPending ? 'Adding…' : 'Add stage'}
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="workflow-transitions">
            <div className="panel-heading">
              <div>
                <h3>Allowed transitions</h3>
                <p className="muted">
                  Check each destination that staff may move to from a stage.
                </p>
              </div>
              {canManage && (
                <button
                  className="button primary"
                  disabled={transitionsMutation.isPending}
                  onClick={() => transitionsMutation.mutate()}
                >
                  {transitionsMutation.isPending ? 'Saving…' : 'Save transitions'}
                </button>
              )}
            </div>

            <div className="table-wrap">
              <table className="workflow-matrix">
                <thead>
                  <tr>
                    <th>From \ To</th>
                    {orderedStatuses.map((status) => (
                      <th key={status.id}>{status.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderedStatuses.map((from) => (
                    <tr key={from.id}>
                      <th>{from.name}</th>
                      {orderedStatuses.map((to) => {
                        const key = transitionKey(from.id, to.id)
                        const isSelf = from.id === to.id
                        return (
                          <td key={to.id}>
                            <input
                              className="workflow-transition-checkbox"
                              type="checkbox"
                              aria-label={`${from.name} to ${to.name}`}
                              checked={!isSelf && transitionKeys.has(key)}
                              disabled={!canManage || isSelf || from.isSystemFinal}
                              onChange={(event) => {
                                setTransitionKeys((current) => {
                                  const next = new Set(current)
                                  if (event.target.checked) next.add(key)
                                  else next.delete(key)
                                  return next
                                })
                              }}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {(createMutation.isError ||
            updateMutation.isError ||
            deleteMutation.isError ||
            transitionsMutation.isError) && (
            <p className="field-error">
              Unable to apply the workflow change. Final-stage or historical-use protections may apply.
            </p>
          )}
        </>
      )}
    </section>
  )
}

function toStatusInput(status: WorkflowStatus): WorkflowStatusInput {
  return {
    code: status.code,
    name: status.name,
    color: status.color,
    sortOrder: status.sortOrder,
    isSystemFinal: status.isSystemFinal,
  }
}

function transitionKey(fromStatusId: string, toStatusId: string) {
  return `${fromStatusId}>${toStatusId}`
}

function isValidStatusDraft(status: WorkflowStatusInput) {
  return Boolean(
    /^[A-Za-z0-9_]+$/.test(status.code.trim()) &&
      status.name.trim() &&
      /^#[0-9A-Fa-f]{6}$/.test(status.color) &&
      status.sortOrder >= 0,
  )
}
