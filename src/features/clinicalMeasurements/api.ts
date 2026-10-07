import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  ClinicalMeasurement,
  ClinicalMeasurementField,
  RecordClinicalMeasurementValue,
} from './types'

export async function getClinicalMeasurementFields() {
  const response = await api.get<BaseResponse<ClinicalMeasurementField[]>>(
    '/clinical-measurements/fields',
  )
  return response.data.data ?? []
}

export async function getClinicalMeasurements(visitId: string) {
  const response = await api.get<BaseResponse<ClinicalMeasurement[]>>(
    '/clinical-measurements',
    { params: { visitId } },
  )
  return response.data.data ?? []
}

export async function recordClinicalMeasurements(
  visitId: string,
  values: RecordClinicalMeasurementValue[],
) {
  const response = await api.post<BaseResponse<ClinicalMeasurement[]>>(
    '/clinical-measurements',
    { visitId, values },
  )

  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to record clinical measurements.')
  }

  return response.data.data
}
