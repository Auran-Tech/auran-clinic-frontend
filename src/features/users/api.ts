import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'

export interface ClinicUser {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  isActive: boolean
  isSuperUser: boolean
  roles: string[]
}

export async function getDoctors() {
  const response = await api.get<BaseResponse<ClinicUser[]>>('/users')
  return (response.data.data ?? [])
    .filter((user) => user.isActive && user.roles.includes('DOCTOR'))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}
