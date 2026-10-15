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

export async function exportVisitReportXlsx(query: VisitReportQuery) {
  const response = await api.get<Blob>('/reporting/visits/export/xlsx', {
    params: query,
    responseType: 'blob',
  })

  const disposition = response.headers['content-disposition'] as string | undefined
  const suggested = disposition?.match(/filename="?([^";]+)"?/i)?.[1]
  const from = query.fromDate?.replaceAll('-', '') ?? 'all'
  const to = query.toDate?.replaceAll('-', '') ?? 'all'
  // Browsers may hide Content-Disposition unless CORS exposes it.
  const fallbackName = `auran-visits-${from}-${to}.xlsx`
  const fileName = suggested && /^[a-zA-Z0-9._-]+\.xlsx$/.test(suggested)
    ? suggested
    : fallbackName

  const url = URL.createObjectURL(response.data)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    try { anchor.click() } finally { anchor.remove() }
  } finally {
    URL.revokeObjectURL(url)
  }
}
