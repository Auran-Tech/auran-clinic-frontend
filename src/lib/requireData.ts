import type { BaseResponse } from '../types/api'

export function requireData<T>(response: BaseResponse<T>, fallbackMessage: string): T {
  if (response.data == null) {
    throw new Error(response.message ?? fallbackMessage)
  }
  return response.data
}
