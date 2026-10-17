import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { QueueReport, QueueReportQuery } from './queueReportTypes'

export async function getQueueReport(filters: QueueReportQuery): Promise<QueueReport> {
  const response = await api.get<BaseResponse<QueueReport>>('/reporting/queue', { params: filters })
  if (!response.data.data) throw new Error(response.data.message ?? 'Unable to load queue report.')
  return response.data.data
}

export async function exportQueueReportCsv(filters: QueueReportQuery) {
  const response = await api.get<Blob>('/reporting/queue/export', {
    params: filters,
    responseType: 'blob',
  })
  const from = filters.fromDate?.replaceAll('-', '') ?? 'all'
  const to = filters.toDate?.replaceAll('-', '') ?? 'all'
  const url = URL.createObjectURL(response.data)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = `auran-queue-${from}-${to}.csv`
    document.body.appendChild(link)
    try { link.click() } finally { link.remove() }
  } finally {
    URL.revokeObjectURL(url)
  }
}
