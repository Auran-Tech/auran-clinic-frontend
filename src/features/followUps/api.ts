import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type { CreateFollowUpInput, FollowUp, FollowUpBucket } from './types'

export async function getFollowUps(bucket: FollowUpBucket) {
  const response = await api.get<BaseResponse<FollowUp[]>>('/follow-ups', {
    params: { bucket },
  })
  return response.data.data ?? []
}

export async function createFollowUp(input: CreateFollowUpInput) {
  const response = await api.post<BaseResponse<FollowUp>>('/follow-ups', input)
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to create follow-up.')
  }
  return response.data.data
}

export async function completeFollowUp(followUpId: string) {
  const response = await api.put<BaseResponse<FollowUp>>('/follow-ups/complete', {
    followUpId,
  })
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to complete follow-up.')
  }
  return response.data.data
}

export async function cancelFollowUp(followUpId: string) {
  const response = await api.put<BaseResponse<FollowUp>>('/follow-ups/cancel', {
    followUpId,
  })
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to cancel follow-up.')
  }
  return response.data.data
}
