import { requireData } from '../../lib/requireData'
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
  return requireData(response.data, 'Unable to create employee.')
}

export async function updateEmployee(input: UpdateEmployeeInput) {
  const response = await api.put<BaseResponse<Employee>>('/users', input)
  return requireData(response.data, 'Unable to update employee.')
}

export async function setEmployeeRoles(userId: string, roles: string[]) {
  const response = await api.put<BaseResponse<Employee>>('/users/roles', {
    userId,
    roles,
  })
  return requireData(response.data, 'Unable to update employee roles.')
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
