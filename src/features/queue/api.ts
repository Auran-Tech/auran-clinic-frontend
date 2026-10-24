import { requireData } from '../../lib/requireData'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { QueueEntry, QueueTransitionOption } from './types'
import { QUEUE_SORT_QUERY, QUEUE_SORT_CHOICE } from './listOptions'

export interface QueueSortQuery {
  sortBy: (typeof QUEUE_SORT_QUERY)[keyof typeof QUEUE_SORT_QUERY]['sortBy']
  descending: boolean
}

export async function getActiveQueue() {
  return getSortedQueue(QUEUE_SORT_QUERY[QUEUE_SORT_CHOICE.stage])
}

export async function getSortedQueue(
  query: QueueSortQuery,
  includeRecentExits = false,
) {
  const response = await api.get<BaseResponse<QueueEntry[]>>('/queue', {
    params: { ...query, includeRecentExits },
  })
  return response.data.data ?? []
}

export async function getQueueTransitions(queueEntryId: string) {
  const response = await api.get<BaseResponse<QueueTransitionOption[]>>(
    '/queue/transitions',
    {
      params: { queueEntryId },
    },
  )
  return response.data.data ?? []
}

export async function moveQueueEntry(input: {
  queueEntryId: string
  toWorkflowStatusId: string
  notes?: string
}) {
  const response = await api.put<BaseResponse<QueueEntry>>('/queue/move', input)
  return requireData(response.data, 'Unable to move queue entry.')
}
