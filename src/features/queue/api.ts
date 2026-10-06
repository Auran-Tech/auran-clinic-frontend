import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { QueueEntry, QueueTransitionOption } from './types'

export async function getActiveQueue() {
  const response = await api.get<BaseResponse<QueueEntry[]>>('/queue')
  return response.data.data ?? []
}

export async function getQueueTransitions(queueEntryId: string) {
  const response = await api.get<BaseResponse<QueueTransitionOption[]>>('/queue/transitions', {
    params: { queueEntryId },
  })
  return response.data.data ?? []
}

export async function moveQueueEntry(input: {
  queueEntryId: string
  toWorkflowStatusId: string
  notes?: string
}) {
  const response = await api.put<BaseResponse<QueueEntry>>('/queue/move', input)
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to move queue entry.')
  }
  return response.data.data
}
