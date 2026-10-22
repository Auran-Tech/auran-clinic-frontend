import './settings.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { WorkflowConfigurationPanel } from '../workflow/WorkflowConfigurationPanel'
import { PatientProfileConfigurationPanel } from '../patientProfileAdmin/PatientProfileConfigurationPanel'
import { ClinicalFieldConfigurationPanel } from '../clinicalFieldAdmin/ClinicalFieldConfigurationPanel'
import { ClinicalOrderSectionConfigurationPanel } from '../clinicalOrderConfig/ClinicalOrderSectionConfigurationPanel'
import { DocumentationPolicyPanel } from '../documentationPolicies/DocumentationPolicyPanel'
import { getClinicSettings, getClinicSettingsLookups, updateClinicSettings } from './api'
import type { UpdateClinicSettingsInput } from './types'

const emptyForm: UpdateClinicSettingsInput = {
  clinicName: '',
  logoUrl: '',
  primaryColor: '',
  secondaryColor: '',
  fontFamily: '',
  welcomeTitle: '',
  welcomeMessage: '',
  welcomeButtonText: '',
  timeZoneId: '',
  locale: '',
  dateFormat: '',
  timeFormat: '',
  patientNumberPrefix: '',
  phone: '',
  email: '',
  address: '',
  website: '',
  documentationReminderHours: 12,
  prescriptionHeader: '',
  prescriptionFooter: '',
}

export function SettingsPage() {
  const { t } = useTranslation('settings')
  const auth = useAuth()
  const queryClient = useQueryClient()
  const canView = auth.hasPermission('Settings_View')
  const canManage = auth.hasPermission('Settings_Manage')
  const [form, setForm] = useState<UpdateClinicSettingsInput>(emptyForm)

  const settingsQuery = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: getClinicSettings,
    enabled: canView,
  })

  const lookupsQuery = useQuery({
    queryKey: ['clinic-settings-lookups'],
    queryFn: getClinicSettingsLookups,
    enabled: canView,
  })

  useEffect(() => {
    const settings = settingsQuery.data
    if (!settings) return

    setForm({
      clinicName: settings.clinicName,
      logoUrl: settings.logoUrl ?? '',
      primaryColor: settings.primaryColor ?? '',
      secondaryColor: settings.secondaryColor ?? '',
      fontFamily: settings.fontFamily ?? '',
      welcomeTitle: settings.welcomeTitle ?? '',
      welcomeMessage: settings.welcomeMessage ?? '',
      welcomeButtonText: settings.welcomeButtonText ?? '',
      timeZoneId: settings.timeZoneId ?? '',
      locale: settings.locale ?? '',
      dateFormat: settings.dateFormat ?? '',
      timeFormat: settings.timeFormat ?? '',
      patientNumberPrefix: settings.patientNumberPrefix ?? '',
      phone: settings.phone ?? '',
      email: settings.email ?? '',
      address: settings.address ?? '',
      website: settings.website ?? '',
      documentationReminderHours: settings.documentationReminderHours,
      prescriptionHeader: settings.prescriptionHeader ?? '',
      prescriptionFooter: settings.prescriptionFooter ?? '',
    })
  }, [settingsQuery.data])

  const mutation = useMutation({
    mutationFn: updateClinicSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(['clinic-settings'], settings)
    },
  })

  if (!canView) {
    return (
      <main className="page-shell">
        <p className="state error">{t('forbidden')}</p>
      </main>
    )
  }

  const updateField = <K extends keyof UpdateClinicSettingsInput>(
    key: K,
    value: UpdateClinicSettingsInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const disabled = !canManage

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t('title')}</h1>
          <p className="muted">{t('subtitle')}</p>
        </div>
        <div className="actions">
          {auth.hasPermission('Audit_View') && (
            <Link className="button secondary nav-button" to="/audit">
              {t('audit')}
            </Link>
          )}
          {auth.hasPermission('Reports_View') && (
            <Link className="button secondary nav-button" to="/reports">
              {t('dashboard')}
            </Link>
          )}
          {(auth.hasPermission('Users_View') || auth.hasPermission('RBAC_View')) && (
            <Link className="button secondary nav-button" to="/employees">
              {t('employees')}
            </Link>
          )}
          <Link className="button secondary nav-button" to="/patients">
            {t('patients')}
          </Link>
        </div>
      </section>

      {settingsQuery.isLoading && <p className="state">{t('loading')}</p>}
      {settingsQuery.isError && <p className="state error">{t('loadError')}</p>}

      {settingsQuery.data && (
        <>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{t('general')}</h2>
                <p className="muted">
                  Clinic code:{' '}
                  <span className="mono">{settingsQuery.data.clinicCode}</span>
                </p>
              </div>
            </div>

            <div className="settings-grid">
              <label>
                <span>{t('clinicName')}</span>
                <input
                  value={form.clinicName}
                  disabled={disabled}
                  onChange={(event) => updateField('clinicName', event.target.value)}
                />
              </label>

              <label>
                <span>{t('patientNumberPrefix')}</span>
                <input
                  value={form.patientNumberPrefix ?? ''}
                  disabled={disabled}
                  onChange={(event) =>
                    updateField('patientNumberPrefix', event.target.value)
                  }
                  placeholder="PAT"
                />
              </label>

              <label>
                <span>{t('reminderHours')}</span>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={form.documentationReminderHours}
                  disabled={disabled}
                  onChange={(event) =>
                    updateField('documentationReminderHours', Number(event.target.value))
                  }
                />
              </label>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{t('brandingTitle')}</h2>
                <p className="muted">{t('brandingSubtitle')}</p>
              </div>
            </div>

            <div className="settings-grid">
              <label className="full-width">
                <span>{t('logoUrl')}</span>
                <input
                  value={form.logoUrl ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('logoUrl', event.target.value)}
                />
              </label>

              <label>
                <span>{t('primaryColor')}</span>
                <input
                  value={form.primaryColor ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('primaryColor', event.target.value)}
                  placeholder="#1f2937"
                />
              </label>

              <label>
                <span>{t('secondaryColor')}</span>
                <input
                  value={form.secondaryColor ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('secondaryColor', event.target.value)}
                  placeholder="#e5e7eb"
                />
              </label>

              <label>
                <span>{t('fontFamily')}</span>
                <input
                  value={form.fontFamily ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('fontFamily', event.target.value)}
                />
              </label>

              <label>
                <span>{t('welcomeButton')}</span>
                <input
                  value={form.welcomeButtonText ?? ''}
                  disabled={disabled}
                  onChange={(event) =>
                    updateField('welcomeButtonText', event.target.value)
                  }
                />
              </label>

              <label className="full-width">
                <span>{t('welcomeTitle')}</span>
                <input
                  value={form.welcomeTitle ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('welcomeTitle', event.target.value)}
                />
              </label>

              <label className="full-width">
                <span>{t('welcomeMessage')}</span>
                <textarea
                  rows={4}
                  value={form.welcomeMessage ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('welcomeMessage', event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{t('localizationTitle')}</h2>
                <p className="muted">{t('localizationSubtitle')}</p>
              </div>
            </div>

            <div className="settings-grid">
              <label>
                <span>{t('timeZone')}</span>
                <select
                  value={form.timeZoneId ?? ''}
                  disabled={disabled || lookupsQuery.isLoading}
                  onChange={(event) => updateField('timeZoneId', event.target.value)}
                >
                  <option value="">{t('notConfigured')}</option>
                  {(lookupsQuery.data?.timeZones ?? []).map((timeZone) => (
                    <option key={timeZone.id} value={timeZone.id}>
                      {timeZone.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>{t('locale')}</span>
                <select
                  value={form.locale ?? ''}
                  disabled={disabled || lookupsQuery.isLoading}
                  onChange={(event) => updateField('locale', event.target.value)}
                >
                  <option value="">{t('notConfigured')}</option>
                  {(lookupsQuery.data?.locales ?? []).map((locale) => (
                    <option key={locale.code} value={locale.code}>
                      {locale.displayName} — {locale.nativeName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>{t('dateFormat')}</span>
                <input
                  value={form.dateFormat ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('dateFormat', event.target.value)}
                  placeholder="dd/MM/yyyy"
                />
              </label>

              <label>
                <span>{t('timeFormat')}</span>
                <input
                  value={form.timeFormat ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('timeFormat', event.target.value)}
                  placeholder="HH:mm"
                />
              </label>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{t('contactTitle')}</h2>
                <p className="muted">{t('contactSubtitle')}</p>
              </div>
            </div>

            <div className="settings-grid">
              <label>
                <span>{t('phone')}</span>
                <input
                  value={form.phone ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </label>

              <label>
                <span>{t('email')}</span>
                <input
                  type="email"
                  value={form.email ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </label>

              <label className="full-width">
                <span>{t('address')}</span>
                <textarea
                  rows={3}
                  value={form.address ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('address', event.target.value)}
                />
              </label>

              <label className="full-width">
                <span>{t('website')}</span>
                <input
                  value={form.website ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('website', event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{t('prescriptionTitle')}</h2>
                <p className="muted">{t('prescriptionSubtitle')}</p>
              </div>
            </div>

            <div className="settings-grid">
              <label className="full-width">
                <span>{t('prescriptionHeader')}</span>
                <textarea
                  rows={4}
                  value={form.prescriptionHeader ?? ''}
                  disabled={disabled}
                  onChange={(event) =>
                    updateField('prescriptionHeader', event.target.value)
                  }
                />
              </label>

              <label className="full-width">
                <span>{t('prescriptionFooter')}</span>
                <textarea
                  rows={4}
                  value={form.prescriptionFooter ?? ''}
                  disabled={disabled}
                  onChange={(event) =>
                    updateField('prescriptionFooter', event.target.value)
                  }
                />
              </label>
            </div>
          </section>

          <WorkflowConfigurationPanel />
          <PatientProfileConfigurationPanel />
          <ClinicalFieldConfigurationPanel />
          <ClinicalOrderSectionConfigurationPanel />
          <DocumentationPolicyPanel />

          {canManage && (
            <section className="settings-save-bar">
              <div>
                <strong>{t('saveTitle')}</strong>
                <p className="muted">{t('saveSubtitle')}</p>
              </div>
              <button
                className="button primary"
                disabled={
                  mutation.isPending ||
                  !form.clinicName.trim() ||
                  form.documentationReminderHours < 1
                }
                onClick={() =>
                  mutation.mutate({
                    ...form,
                    clinicName: form.clinicName.trim(),
                    patientNumberPrefix: form.patientNumberPrefix?.trim() || undefined,
                    logoUrl: form.logoUrl?.trim() || undefined,
                    primaryColor: form.primaryColor?.trim() || undefined,
                    secondaryColor: form.secondaryColor?.trim() || undefined,
                    fontFamily: form.fontFamily?.trim() || undefined,
                    welcomeTitle: form.welcomeTitle?.trim() || undefined,
                    welcomeMessage: form.welcomeMessage?.trim() || undefined,
                    welcomeButtonText: form.welcomeButtonText?.trim() || undefined,
                    timeZoneId: form.timeZoneId || undefined,
                    locale: form.locale || undefined,
                    dateFormat: form.dateFormat?.trim() || undefined,
                    timeFormat: form.timeFormat?.trim() || undefined,
                    phone: form.phone?.trim() || undefined,
                    email: form.email?.trim() || undefined,
                    address: form.address?.trim() || undefined,
                    website: form.website?.trim() || undefined,
                    prescriptionHeader: form.prescriptionHeader?.trim() || undefined,
                    prescriptionFooter: form.prescriptionFooter?.trim() || undefined,
                  })
                }
              >
                {mutation.isPending ? t('saving') : t('save')}
              </button>
            </section>
          )}

          {mutation.isSuccess && <p className="state">{t('saved')}</p>}
          {mutation.isError && <p className="state error">{t('saveError')}</p>}
        </>
      )}
    </main>
  )
}
