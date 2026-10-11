export interface Employee {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  isActive: boolean
  isSuperUser: boolean
  roles: string[]
}

export interface SystemRole {
  code: string
  name: string
  permissions: string[]
}

export interface PermissionCatalogItem {
  key: string
  group: string
  descriptions: Record<string, string>
}

export interface CreateEmployeeInput {
  fullName: string
  email: string
  password: string
  phone?: string
  isSuperUser: boolean
  roles: string[]
}

export interface UpdateEmployeeInput {
  userId: string
  fullName: string
  email: string
  phone?: string
}
