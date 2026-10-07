import { api } from '../../lib/api'
import type { BaseResponse } from '../../types/api'
import type {
  CreateEmployeeInput,
  Employee,
  PermissionCatalogItem,
  SystemRole,
  UpdateEmployeeInput,
} from './types'

export async function getEmployees() {
  const response = await api.get<BaseResponse<Employee[]>>('/users')
  return response.data.data ?? []
}

export async function createEmployee(input: CreateEmployeeInput) {
  const response = await api.post<BaseResponse<Employee>>('/users', input)
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to create employee.')
  }
  return response.data.data
}

export async function updateEmployee(input: UpdateEmployeeInput) {
  const response = await api.put<BaseResponse<Employee>>('/users', input)
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to update employee.')
  }
  return response.data.data
}

export async function setEmployeeRoles(userId: string, roles: string[]) {
  const response = await api.put<BaseResponse<Employee>>('/users/roles', {
    userId,
    roles,
  })
  if (!response.data.data) {
    throw new Error(response.data.message ?? 'Unable to update employee roles.')
  }
  return response.data.data
}

export async function setEmployeeStatus(userId: string, isActive: boolean) {
  await api.put('/users/status', { userId, isActive })
}

export async function getSystemRoles() {
  const response = await api.get<BaseResponse<SystemRole[]>>('/roles')
  return response.data.data ?? []
}

export async function getPermissionCatalog() {
  const response = await api.get<BaseResponse<PermissionCatalogItem[]>>('/permissions/list')
  return response.data.data ?? []
}
