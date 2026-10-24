import './QueueActions.css'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowRightLeft } from 'lucide-react'
import { Dropdown } from 'primereact/dropdown'
import { useAuth } from '../auth/AuthContext'
import { getQueueTransitions } from './api'
import type { QueueEntry } from './types'
import { stageLabel } from './stageLabel'
import { useMoveQueueEntry } from './useMoveQueueEntry'

interface QueueActionsProps {
  entry: QueueEntry
}

export function QueueActions({ entry }: QueueActionsProps) {
  const { t, i18n } = useTranslation('queue')
  const auth = useAuth()
  const [open, setOpen] = useState(false)
  const [selectedStatusId, setSelectedStatusId] = useState('')
  const canMove = auth.hasPermission('Queue_Move')
  const transitionsQuery = useQuery({
    queryKey: ['queue-transitions', entry.queueEntryId],
    queryFn: () => getQueueTransitions(entry.queueEntryId),
    enabled: canMove && open,
  })
  const moveMutation = useMoveQueueEntry()
  const selectedTransition = transitionsQuery.data?.find(
    (status) => status.workflowStatusId === selectedStatusId,
  )

  if (!canMove) {
    return <span className="queue-view-only">{t('viewOnly')}</span>
  }

  return (
    <div className={`queue-actions${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="queue-action-toggle"
        aria-expanded={open}
        aria-controls={`queue-action-${entry.queueEntryId}`}
        onClick={() => {
          setOpen((value) => !value)
          setSelectedStatusId('')
        }}
      >
        <ArrowRightLeft size={13} aria-hidden="true" />
        {t('move')}
      </button>
      {open && (
        <div className="queue-action-menu" id={`queue-action-${entry.queueEntryId}`}>
          {transitionsQuery.isLoading && <small>{t('loadingTransitions')}</small>}
          {transitionsQuery.isError && (
            <small className="field-error" role="alert">
              {t('transitionsError')}
            </small>
          )}
          {transitionsQuery.data?.length === 0 && <small>{t('noTransitions')}</small>}
          {transitionsQuery.data && transitionsQuery.data.length > 0 && (
            <>
              <Dropdown
                className="auran-prime-field"
                panelClassName="auran-prime-panel"
                aria-label={t('moveTo')}
                value={selectedStatusId}
                options={transitionsQuery.data.map((status) => ({
                  label: stageLabel(status.code, status.name, i18n.language, t),
                  value: status.workflowStatusId,
                }))}
                optionLabel="label"
                optionValue="value"
                placeholder={t('moveTo')}
                filter
                onChange={(event) => setSelectedStatusId(event.value as string)}
              />
              {selectedTransition?.isSystemFinal && (
                <small className="queue-final-warning">
                  {t('finalTransitionWarning')}
                </small>
              )}
              <button
                type="button"
                className="button primary"
                disabled={!selectedStatusId || moveMutation.isPending}
                onClick={() =>
                  moveMutation.mutate(
                    {
                      queueEntryId: entry.queueEntryId,
                      toWorkflowStatusId: selectedStatusId,
                    },
                    {
                      onSuccess: () => {
                        setSelectedStatusId('')
                        setOpen(false)
                      },
                    },
                  )
                }
              >
                {moveMutation.isPending ? t('moving') : t('confirmMove')}
              </button>
            </>
          )}
          {moveMutation.isError && (
            <small className="field-error" role="alert">
              {t('moveError')}
            </small>
          )}
        </div>
      )}
    </div>
  )
}
