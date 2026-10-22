import { requireData } from '../../lib/requireData'
import axios from 'axios'
import type { BaseResponse } from '../../types/api'
import { apiBaseUrl } from '../../lib/apiConfig'
import { reportConnectionFailure } from '../../lib/connectionSignals'

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
export interface PlatformClinicDetails extends PlatformClinic {
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  locale: string | null
  initialAdminUserId: string | null
  initialAdminEmail: string | null
}

export interface UpdatePlatformClinicInput {
  clinicId: string
  name: string
  timeZoneId?: string
  patientNumberPrefix?: string
  phone?: string
  email?: string
  address?: string
  website?: string
  locale?: string
}

export interface ProvisionClinicInput {
  name: string
  codePrefix: string
  timeZoneId?: string
  patientNumberPrefix?: string
  locale?: string
  admin: { fullName: string; email: string; password: string }
}

const client = axios.create({ baseURL: apiBaseUrl, timeout: 20_000 })
client.interceptors.response.use(response => response, error => {
  reportConnectionFailure(error)
  return Promise.reject(error)
})

export async function platformLogin(email: string, password: string): Promise<PlatformSession> {
  const response = await client.post<BaseResponse<PlatformSession>>('/platform/auth/login', { email, password })
  return requireData(response.data, 'Unable to sign in.')
}

function authorization(session: PlatformSession) {
  return { headers: { Authorization: `Bearer ${session.accessToken}` } }
}

export async function listPlatformClinics(session: PlatformSession): Promise<PlatformClinic[]> {
  const response = await client.get<BaseResponse<PlatformClinic[]>>('/platform/clinics', authorization(session))
  return requireData(response.data, 'Unable to load clinics.')
}

export async function provisionPlatformClinic(session: PlatformSession, data: ProvisionClinicInput) {
  const response = await client.post<BaseResponse<PlatformClinic>>('/platform/clinics', data, authorization(session))
  return requireData(response.data, 'Unable to provision clinic.')
}

export async function setPlatformClinicStatus(session: PlatformSession, clinicId: string, isActive: boolean) {
  await client.put('/platform/clinics/status', { clinicId, isActive }, authorization(session))
}

export async function platformLogout(session: PlatformSession) {
  await client.post('/platform/auth/logout', { refreshToken: session.refreshToken }, authorization(session))
}

export async function getPlatformClinicDetails(session: PlatformSession, clinicId: string): Promise<PlatformClinicDetails> {
  const response = await client.get<BaseResponse<PlatformClinicDetails>>('/platform/clinics/details', {
    ...authorization(session), params: { clinicId },
  })
  return requireData(response.data, 'Unable to load clinic details.')
}

export async function updatePlatformClinic(session: PlatformSession, input: UpdatePlatformClinicInput): Promise<PlatformClinicDetails> {
  const response = await client.put<BaseResponse<PlatformClinicDetails>>('/platform/clinics', input, authorization(session))
  return requireData(response.data, 'Unable to update clinic.')
}

export async function platformRefresh(refreshToken: string): Promise<PlatformSession> {
  // Refresh uses the isolated Platform actor endpoint. Never use clinic refresh.
  const response = await client.post<BaseResponse<PlatformSession>>('/platform/auth/refresh', { refreshToken })
  return requireData(response.data, 'Platform session expired.')
}

export interface PlatformTimeZone { id: string; displayName: string; utcOffset: string }
export interface PlatformLocale { code: string; displayName: string; nativeName: string }

export async function getPlatformLookups(session: PlatformSession) {
  const [timeZones, locales] = await Promise.all([
    client.get<BaseResponse<PlatformTimeZone[]>>('/platform/lookups/time-zones', authorization(session)),
    client.get<BaseResponse<PlatformLocale[]>>('/platform/lookups/locales', authorization(session)),
  ])
  if (!timeZones.data.data || !locales.data.data) throw new Error('Unable to retrieve platform lookups.')
  return { timeZones: timeZones.data.data, locales: locales.data.data }
}
