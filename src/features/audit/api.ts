import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { AuditLogItem, AuditLogQuery } from './types'

export async function searchAuditLogs(query: AuditLogQuery) {
  const response = await api.get<BaseResponse<AuditLogItem[]>>('/audit-search', {
    params: query,
  })
  return response.data.data ?? []
}
