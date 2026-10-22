import { requireData } from '../../lib/requireData'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  WorkflowConfiguration,
  WorkflowStatusInput,
} from './types'

export async function getWorkflowConfiguration() {
  const response = await api.get<BaseResponse<WorkflowConfiguration>>('/workflow-config')
  return requireData(response.data, 'Unable to load workflow configuration.')
}

export async function createWorkflowStatus(input: WorkflowStatusInput) {
  const response = await api.post<BaseResponse<WorkflowConfiguration>>(
    '/workflow-config/statuses',
    input,
  )
  return requireData(response.data, 'Unable to create workflow status.')
}

export async function updateWorkflowStatus(
  statusId: string,
  input: WorkflowStatusInput,
) {
  const response = await api.put<BaseResponse<WorkflowConfiguration>>(
    '/workflow-config/statuses',
    { statusId, ...input },
  )
  return requireData(response.data, 'Unable to update workflow status.')
}

export async function deleteWorkflowStatus(statusId: string) {
  const response = await api.delete<BaseResponse<WorkflowConfiguration>>(
    '/workflow-config/statuses',
    { data: { statusId } },
  )
  return requireData(response.data, 'Unable to delete workflow status.')
}

export async function replaceWorkflowTransitions(
  transitions: { fromStatusId: string; toStatusId: string }[],
) {
  const response = await api.put<BaseResponse<WorkflowConfiguration>>(
    '/workflow-config/transitions',
    { transitions },
  )
  return requireData(response.data, 'Unable to update workflow transitions.')
}
