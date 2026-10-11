import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  DashboardSummary,
  VisitReport,
  VisitReportQuery,
} from './types'

export async function getDashboardSummary() {
  const response = await api.get<BaseResponse<DashboardSummary>>('/reporting/dashboard')
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to load dashboard.')
  }
  return response.data.data
}

export async function getVisitReport(query: VisitReportQuery) {
  const response = await api.get<BaseResponse<VisitReport>>('/reporting/visits', {
    params: query,
  })
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to load visit report.')
  }
  return response.data.data
}

export async function exportVisitReport(query: VisitReportQuery) {
  const response = await api.get<Blob>('/reporting/visits/export', {
    params: query,
    responseType: 'blob',
  })

  const disposition = response.headers['content-disposition'] as string | undefined
  const match = disposition?.match(/filename="?([^"]+)"?/)
  const fileName = match?.[1] ?? 'auran-visits.csv'

  const url = URL.createObjectURL(response.data)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
