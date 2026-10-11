import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  WorkflowConfiguration,
  WorkflowStatusInput,
} from './types'

export async function getWorkflowConfiguration() {
  const response = await api.get<BaseResponse<WorkflowConfiguration>>('/workflow-config')
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to load workflow configuration.')
  }
  return response.data.data
}

export async function createWorkflowStatus(input: WorkflowStatusInput) {
  const response = await api.post<BaseResponse<WorkflowConfiguration>>(
    '/workflow-config/statuses',
    input,
  )
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to create workflow status.')
  }
  return response.data.data
}

export async function updateWorkflowStatus(
  statusId: string,
  input: WorkflowStatusInput,
) {
  const response = await api.put<BaseResponse<WorkflowConfiguration>>(
    '/workflow-config/statuses',
    { statusId, ...input },
  )
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to update workflow status.')
  }
  return response.data.data
}

export async function deleteWorkflowStatus(statusId: string) {
  const response = await api.delete<BaseResponse<WorkflowConfiguration>>(
    '/workflow-config/statuses',
    { data: { statusId } },
  )
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to delete workflow status.')
  }
  return response.data.data
}

export async function replaceWorkflowTransitions(
  transitions: { fromStatusId: string; toStatusId: string }[],
) {
  const response = await api.put<BaseResponse<WorkflowConfiguration>>(
    '/workflow-config/transitions',
    { transitions },
  )
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to update workflow transitions.')
  }
  return response.data.data
}
