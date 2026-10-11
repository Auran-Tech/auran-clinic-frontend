export interface TimeZoneLookup {
  id: string
  displayName: string
  utcOffset: string
}

export interface LocaleLookup {
  code: string
  displayName: string
  nativeName: string
}

export interface ClinicSettingsLookups {
  timeZones: TimeZoneLookup[]
  locales: LocaleLookup[]
}

export interface ClinicSettings {
  clinicId: string
  clinicName: string
  clinicCode: string
  isActive: boolean
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  fontFamily?: string | null
  welcomeTitle?: string | null
  welcomeMessage?: string | null
  welcomeButtonText?: string | null
  timeZoneId?: string | null
  locale?: string | null
  dateFormat?: string | null
  timeFormat?: string | null
  patientNumberPrefix?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  website?: string | null
  documentationReminderHours: number
  prescriptionHeader?: string | null
  prescriptionFooter?: string | null
}

export type UpdateClinicSettingsInput = Omit<
  ClinicSettings,
  'clinicId' | 'clinicCode' | 'isActive'
>
