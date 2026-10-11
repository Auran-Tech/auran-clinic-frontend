export interface AuditLogItem {
  id: string
  actorUserId: string
  actorName: string
  action: string
  entityType: string
  entityId?: string | null
  occurredAtUtc: string
  metadataJson?: string | null
  ipAddress?: string | null
}

export interface AuditLogQuery {
  take?: number
  action?: string
  entityType?: string
  actorUserId?: string
  fromUtc?: string
  toUtc?: string
}
