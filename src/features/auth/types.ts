export interface CurrentUser {
  userId: string
  clinicId: string
  fullName: string
  email?: string | null
  isSuperUser: boolean
  roles: string[]
  permissions: string[]
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  accessTokenExpiresDate: string
  user: CurrentUser
}

export interface LoginInput {
  email: string
  password: string
}
