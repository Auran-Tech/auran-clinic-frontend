import axios from 'axios'
import type { BaseResponse } from '../../types/api'

// Platform credentials are intentionally never stored in the clinic auth store.
// The platform client must never use the clinic Axios interceptors.
export interface PlatformUser {
  platformUserId: string
  fullName: string
  email: string
}
export interface PlatformSession {
  accessToken: string
  refreshToken: string
  accessTokenExpiresDate: string
  user: PlatformUser
}
export interface PlatformClinic {
  id: string
  name: string
  code: string
  isActive: boolean
  timeZoneId: string | null
  patientNumberPrefix: string | null
  createdDate: string
}
export interface ProvisionClinicInput {
  name: string
  codePrefix: string
  timeZoneId?: string
  patientNumberPrefix?: string
  locale?: string
  admin: { fullName: string; email: string; password: string }
}

const baseURL = import.meta.env.VITE_API_BASE_URL
if (!baseURL) throw new Error('VITE_API_BASE_URL is required.')
const client = axios.create({ baseURL, timeout: 20_000 })

export async function platformLogin(email: string, password: string): Promise<PlatformSession> {
  const response = await client.post<BaseResponse<PlatformSession>>('/platform/auth/login', { email, password })
  if (!response.data.data) throw new Error(response.data.message ?? 'Unable to sign in.')
  return response.data.data
}

function authorization(session: PlatformSession) {
  return { headers: { Authorization: `Bearer ${session.accessToken}` } }
}

export async function listPlatformClinics(session: PlatformSession): Promise<PlatformClinic[]> {
  const response = await client.get<BaseResponse<PlatformClinic[]>>('/platform/clinics', authorization(session))
  if (!response.data.data) throw new Error(response.data.message ?? 'Unable to load clinics.')
  return response.data.data
}

export async function provisionPlatformClinic(session: PlatformSession, data: ProvisionClinicInput) {
  const response = await client.post<BaseResponse<PlatformClinic>>('/platform/clinics', data, authorization(session))
  if (!response.data.data) throw new Error(response.data.message ?? 'Unable to provision clinic.')
  return response.data.data
}

export async function setPlatformClinicStatus(session: PlatformSession, clinicId: string, isActive: boolean) {
  await client.put('/platform/clinics/status', { clinicId, isActive }, authorization(session))
}

export async function platformLogout(session: PlatformSession) {
  await client.post('/platform/auth/logout', { refreshToken: session.refreshToken }, authorization(session))
}
