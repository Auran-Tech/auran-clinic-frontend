import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  getClinicalOrder,
  getClinicalOrderDefinitions,
  saveClinicalOrder,
} from './api'

interface ClinicalOrderEditorProps {
  visitId: string
}

interface SectionDraft {
  textValue: string
  itemsText: string
}

export function ClinicalOrderEditor({ visitId }: ClinicalOrderEditorProps) {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const canEdit = auth.hasPermission('Visit_Edit')
  const [drafts, setDrafts] = useState<Record<string, SectionDraft>>({})

  const definitionsQuery = useQuery({
    queryKey: ['clinical-order-definitions'],
    queryFn: getClinicalOrderDefinitions,
    enabled: auth.hasPermission('Visit_View'),
  })

  const orderQuery = useQuery({
    queryKey: ['clinical-order', visitId],
    queryFn: () => getClinicalOrder(visitId),
    enabled: auth.hasPermission('Visit_View'),
  })

  const definitions = useMemo(
    () => definitionsQuery.data ?? [],
    [definitionsQuery.data],
  )

  useEffect(() => {
    if (definitions.length === 0) return

    const currentOrder = orderQuery.data
    const next: Record<string, SectionDraft> = {}

    for (const definition of definitions) {
      const section = currentOrder?.sections.find(
        (item) => item.sectionDefinitionId === definition.id,
      )

      next[definition.id] = {
        textValue: section?.textValue ?? '',
        itemsText: section?.items.map((item) => item.name).join('\n') ?? '',
      }
    }

    setDrafts(next)
  }, [definitions, orderQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      saveClinicalOrder({
        visitId,
        sections: definitions
          .map((definition) => {
            const draft = drafts[definition.id] ?? { textValue: '', itemsText: '' }
            return {
              sectionDefinitionId: definition.id,
              textValue:
                definition.sectionType === 'Text' && draft.textValue.trim()
                  ? draft.textValue.trim()
                  : undefined,
              items:
                definition.sectionType === 'Structured'
                  ? draft.itemsText
                      .split('\n')
                      .map((value) => value.trim())
                      .filter(Boolean)
                      .map((name) => ({ name }))
                  : [],
            }
          })
          .filter(
            (section) =>
              Boolean(section.textValue) || section.items.length > 0,
          ),
      }),
    onSuccess: (order) => {
      queryClient.setQueryData(['clinical-order', visitId], order)
    },
  })

  if (!auth.hasPermission('Visit_View')) {
    return null
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Clinical order / prescription</h2>
          <p className="muted">
            Sections come from the clinic configuration and are stored with this visit.
          </p>
        </div>
      </div>

      {(definitionsQuery.isLoading || orderQuery.isLoading) && (
        <p className="state">Loading clinical order…</p>
      )}

      {definitionsQuery.isError || orderQuery.isError ? (
        <p className="state error">Unable to load clinical order configuration.</p>
      ) : null}

      {!definitionsQuery.isLoading && definitions.length === 0 && (
        <p className="state">No enabled clinical-order sections are configured.</p>
      )}

      {definitions.length > 0 && (
        <div className="clinical-order-sections">
          {definitions.map((definition) => {
            const draft = drafts[definition.id] ?? { textValue: '', itemsText: '' }

            return (
              <div className="clinical-order-section" key={definition.id}>
                <div>
                  <span className="profile-label">{definition.sectionType}</span>
                  <h3>{definition.name}</h3>
                </div>

                {definition.sectionType === 'Structured' ? (
                  <label>
                    <span>Items</span>
                    <textarea
                      rows={5}
                      value={draft.itemsText}
                      disabled={!canEdit}
                      placeholder="One item per line"
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [definition.id]: {
                            ...draft,
                            itemsText: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                ) : (
                  <label>
                    <span>Content</span>
                    <textarea
                      rows={5}
                      value={draft.textValue}
                      disabled={!canEdit}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [definition.id]: {
                            ...draft,
                            textValue: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                )}
              </div>
            )
          })}

          {canEdit && (
            <div className="actions">
              <button
                className="button primary"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save clinical order'}
              </button>
            </div>
          )}

          {saveMutation.isError && (
            <p className="field-error">Unable to save the clinical order.</p>
          )}
        </div>
      )}
    </section>
  )
}
