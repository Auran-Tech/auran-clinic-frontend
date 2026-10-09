import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { WorkflowConfigurationPanel } from '../workflow/WorkflowConfigurationPanel'
import { PatientProfileConfigurationPanel } from '../patientProfileAdmin/PatientProfileConfigurationPanel'
import { ClinicalFieldConfigurationPanel } from '../clinicalFieldAdmin/ClinicalFieldConfigurationPanel'
import { ClinicalOrderSectionConfigurationPanel } from '../clinicalOrderConfig/ClinicalOrderSectionConfigurationPanel'
import {
  getClinicSettings,
  getClinicSettingsLookups,
  updateClinicSettings,
} from './api'
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
  const auth = useAuth()
  const { t } = useTranslation()
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
        <p className="state error">{t('settingsPage.denied')}</p>
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
          <p className="eyebrow">{t('settingsPage.eyebrow')}</p>
          <h1>{t('settingsPage.title')}</h1>
          <p className="muted">
            {t('settingsPage.intro')}
          </p>
        </div>
        <div className="actions">
          <Link className="button secondary nav-button" to="/guide">{t('common.guide')}</Link>
          {auth.hasPermission('Audit_View') && (
            <Link className="button secondary nav-button" to="/audit">{t('common.audit')}</Link>
          )}
          {auth.hasPermission('Reports_View') && (
            <Link className="button secondary nav-button" to="/reports">{t('common.dashboard')}</Link>
          )}
          {(auth.hasPermission('Users_View') || auth.hasPermission('RBAC_View')) && (
            <Link className="button secondary nav-button" to="/employees">{t('common.employees')}</Link>
          )}
          <Link className="button secondary nav-button" to="/patients">{t('common.patients')}</Link>
        </div>
      </section>

      {settingsQuery.isLoading && <p className="state">{t('settingsPage.loading')}</p>}
      {settingsQuery.isError && <p className="state error">{t('settingsPage.loadError')}</p>}

      {settingsQuery.data && (
        <>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{t('settingsPage.general')}</h2>
                <p className="muted">
                  {t('settingsPage.clinicCode')}: <span className="mono">{settingsQuery.data.clinicCode}</span>
                </p>
              </div>
            </div>

            <div className="settings-grid">
              <label>
                <span>{t('settingsPage.clinicName')}</span>
                <input
                  value={form.clinicName}
                  disabled={disabled}
                  onChange={(event) => updateField('clinicName', event.target.value)}
                />
              </label>

              <label>
                <span>{t('settingsPage.patientPrefix')}</span>
                <input
                  value={form.patientNumberPrefix ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('patientNumberPrefix', event.target.value)}
                  placeholder="PAT"
                />
              </label>

              <label>
                <span>{t('settingsPage.reminderHours')}</span>
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
                <h2>{t('settingsPage.branding')}</h2>
                <p className="muted">{t('settingsPage.brandingIntro')}</p>
              </div>
            </div>

            <div className="settings-grid">
              <label className="full-width">
                <span>{t('settingsPage.logoUrl')}</span>
                <input
                  value={form.logoUrl ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('logoUrl', event.target.value)}
                />
              </label>

              <label>
                <span>{t('settingsPage.primaryColor')}</span>
                <input
                  value={form.primaryColor ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('primaryColor', event.target.value)}
                  placeholder="#1f2937"
                />
              </label>

              <label>
                <span>{t('settingsPage.secondaryColor')}</span>
                <input
                  value={form.secondaryColor ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('secondaryColor', event.target.value)}
                  placeholder="#e5e7eb"
                />
              </label>

              <label>
                <span>{t('settingsPage.fontFamily')}</span>
                <input
                  value={form.fontFamily ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('fontFamily', event.target.value)}
                />
              </label>

              <label>
                <span>{t('settingsPage.welcomeButton')}</span>
                <input
                  value={form.welcomeButtonText ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('welcomeButtonText', event.target.value)}
                />
              </label>

              <label className="full-width">
                <span>{t('settingsPage.welcomeTitle')}</span>
                <input
                  value={form.welcomeTitle ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('welcomeTitle', event.target.value)}
                />
              </label>

              <label className="full-width">
                <span>{t('settingsPage.welcomeMessage')}</span>
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
                <h2>{t('settingsPage.localization')}</h2>
                <p className="muted">{t('settingsPage.localizationIntro')}</p>
              </div>
            </div>

            <div className="settings-grid">
              <label>
                <span>{t('settingsPage.timezone')}</span>
                <select
                  value={form.timeZoneId ?? ''}
                  disabled={disabled || lookupsQuery.isLoading}
                  onChange={(event) => updateField('timeZoneId', event.target.value)}
                >
                  <option value="">{t('settingsPage.notConfigured')}</option>
                  {(lookupsQuery.data?.timeZones ?? []).map((timeZone) => (
                    <option key={timeZone.id} value={timeZone.id}>
                      {timeZone.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>{t('settingsPage.locale')}</span>
                <select
                  value={form.locale ?? ''}
                  disabled={disabled || lookupsQuery.isLoading}
                  onChange={(event) => updateField('locale', event.target.value)}
                >
                  <option value="">{t('settingsPage.notConfigured')}</option>
                  {(lookupsQuery.data?.locales ?? []).map((locale) => (
                    <option key={locale.code} value={locale.code}>
                      {locale.displayName} — {locale.nativeName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>{t('settingsPage.dateFormat')}</span>
                <input
                  value={form.dateFormat ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('dateFormat', event.target.value)}
                  placeholder="dd/MM/yyyy"
                />
              </label>

              <label>
                <span>{t('settingsPage.timeFormat')}</span>
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
                <h2>{t('settingsPage.contact')}</h2>
                <p className="muted">{t('settingsPage.contactIntro')}</p>
              </div>
            </div>

            <div className="settings-grid">
              <label>
                <span>{t('settingsPage.phone')}</span>
                <input
                  value={form.phone ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </label>

              <label>
                <span>{t('settingsPage.email')}</span>
                <input
                  type="email"
                  value={form.email ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </label>

              <label className="full-width">
                <span>{t('settingsPage.address')}</span>
                <textarea
                  rows={3}
                  value={form.address ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('address', event.target.value)}
                />
              </label>

              <label className="full-width">
                <span>{t('settingsPage.website')}</span>
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
                <h2>{t('settingsPage.prescriptionDefaults')}</h2>
                <p className="muted">{t('settingsPage.prescriptionIntro')}</p>
              </div>
            </div>

            <div className="settings-grid">
              <label className="full-width">
                <span>{t('settingsPage.prescriptionHeader')}</span>
                <textarea
                  rows={4}
                  value={form.prescriptionHeader ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('prescriptionHeader', event.target.value)}
                />
              </label>

              <label className="full-width">
                <span>{t('settingsPage.prescriptionFooter')}</span>
                <textarea
                  rows={4}
                  value={form.prescriptionFooter ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateField('prescriptionFooter', event.target.value)}
                />
              </label>
            </div>
          </section>

          <WorkflowConfigurationPanel />

          <PatientProfileConfigurationPanel />

          <ClinicalFieldConfigurationPanel />

          <ClinicalOrderSectionConfigurationPanel />

          {canManage && (
            <section className="settings-save-bar">
              <div>
                <strong>{t('settingsPage.saveTitle')}</strong>
                <p className="muted">{t('settingsPage.saveIntro')}</p>
              </div>
              <button
                className="button primary"
                disabled={
                  mutation.isPending ||
                  !form.clinicName.trim() ||
                  form.documentationReminderHours < 1
                }
                onClick={() => mutation.mutate({
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
                })}
              >
                {mutation.isPending ? t('settingsPage.saving') : t('settingsPage.save')}
              </button>
            </section>
          )}

          {mutation.isSuccess && <p className="state">{t('settingsPage.saved')}</p>}
          {mutation.isError && <p className="state error">{t('settingsPage.saveError')}</p>}
        </>
      )}
    </main>
  )
}
