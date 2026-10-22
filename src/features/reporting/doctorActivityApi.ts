import { requireData } from '../../lib/requireData'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { DoctorActivityQuery, DoctorActivityReport } from './doctorActivityTypes'

export async function getDoctorActivity(filters: DoctorActivityQuery): Promise<DoctorActivityReport> {
  const response = await api.get<BaseResponse<DoctorActivityReport>>('/reporting/doctors', { params: filters })
  return requireData(response.data, 'Unable to load doctor activity.')
}

export async function exportDoctorActivityCsv(filters: DoctorActivityQuery) {
  const response = await api.get<Blob>('/reporting/doctors/export', {
    params: filters,
    responseType: 'blob',
  })
  const from = filters.fromDate?.replaceAll('-', '') ?? 'all'
  const to = filters.toDate?.replaceAll('-', '') ?? 'all'
  const url = URL.createObjectURL(response.data)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = `auran-doctors-${from}-${to}.csv`
    document.body.appendChild(link)
    try { link.click() } finally { link.remove() }
  } finally {
    URL.revokeObjectURL(url)
  }
}
