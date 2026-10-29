import { requireData } from '../../lib/requireData'
import axios from 'axios'
import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  ClinicVisitList,
  ClinicVisitListQuery,
  PatientVisitHistory,
  StartVisitInput,
  Visit,
} from './types'

export interface VisitDoctorOption {
  id: string
  fullName: string
}

export async function getVisitDoctors() {
  const response = await api.get<BaseResponse<VisitDoctorOption[]>>('/visits/doctors')
  return requireData(response.data, 'Unable to load available doctors.')
}

export async function getClinicVisits(query: ClinicVisitListQuery) {
  const response = await api.get<BaseResponse<ClinicVisitList>>('/visits', {
    params: query,
  })
  return requireData(response.data, 'Unable to load clinic visits.')
}

export async function getClinicVisitDoctors() {
  const response =
    await api.get<BaseResponse<VisitDoctorOption[]>>('/visits/list-doctors')
  return requireData(response.data, 'Unable to load visit doctors.')
}

export async function getActiveVisit(patientId: string) {
  try {
    const response = await api.get<BaseResponse<Visit>>('/visits/active', {
      params: { patientId },
    })
    return response.data.data ?? null
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function startVisit(input: StartVisitInput) {
  const response = await api.post<BaseResponse<Visit>>('/visits/start', input)
  return requireData(response.data, 'Unable to start visit.')
}

export async function getPatientVisitHistory(patientId: string, page = 1, pageSize = 10) {
  const response = await api.get<BaseResponse<PatientVisitHistory>>('/visits/history', {
    params: { patientId, page, pageSize },
  })

  return requireData(response.data, 'Unable to load visit history.')
}
