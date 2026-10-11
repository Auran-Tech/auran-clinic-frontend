export interface WorkflowStatus {
  id: string
  code: string
  name: string
  color: string
  sortOrder: number
  isSystemFinal: boolean
  isInUse: boolean
}

export interface WorkflowTransition {
  id: string
  fromStatusId: string
  toStatusId: string
}

export interface WorkflowConfiguration {
  statuses: WorkflowStatus[]
  transitions: WorkflowTransition[]
}

export interface WorkflowStatusInput {
  code: string
  name: string
  color: string
  sortOrder: number
  isSystemFinal: boolean
}
