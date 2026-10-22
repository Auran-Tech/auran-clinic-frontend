import { requireData } from '../../lib/requireData'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { PatientReport, PatientReportQuery } from './patientReportTypes'

export async function getPatientReport(filters: PatientReportQuery): Promise<PatientReport> {
  const response = await api.get<BaseResponse<PatientReport>>('/reporting/patients', { params: filters })
  return requireData(response.data, 'Unable to load patient report.')
}

export async function exportPatientReportCsv(filters: PatientReportQuery) {
  const response = await api.get<Blob>('/reporting/patients/export', {
    params: filters,
    responseType: 'blob',
  })
  const from = filters.fromDate?.replaceAll('-', '') ?? 'all'
  const to = filters.toDate?.replaceAll('-', '') ?? 'all'
  const fileName = `auran-patients-${from}-${to}.csv`
  const url = URL.createObjectURL(response.data)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    try { link.click() } finally { link.remove() }
  } finally {
    URL.revokeObjectURL(url)
  }
}
