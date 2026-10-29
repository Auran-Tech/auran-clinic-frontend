import './settings.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
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

type SettingsTab =
  'general' | 'branding' | 'workflow' | 'medical' | 'orders' | 'documentation'

const settingsTabs: {
  key: SettingsTab
  label:
    | 'general'
    | 'brandingTitle'
    | 'workflowTab'
    | 'medicalTab'
    | 'ordersTab'
    | 'documentationTab'
}[] = [
  { key: 'general', label: 'general' },
  { key: 'branding', label: 'brandingTitle' },
  { key: 'workflow', label: 'workflowTab' },
  { key: 'medical', label: 'medicalTab' },
  { key: 'orders', label: 'ordersTab' },
  { key: 'documentation', label: 'documentationTab' },
]

export function SettingsPage() {
  const { t } = useTranslation('settings')
  const auth = useAuth()
  const queryClient = useQueryClient()
  const canView = auth.hasPermission('Settings_View')
  const canManage = auth.hasPermission('Settings_Manage')
  const [form, setForm] = useState<UpdateClinicSettingsInput>(emptyForm)
  const [tab, setTab] = useState<SettingsTab>('general')

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
    <main className="page-shell settings-page">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t('title')}</h1>
          <p className="muted">{t('subtitle')}</p>
        </div>
      </section>

      <nav className="settings-tabs" aria-label={t('title')}>
        {settingsTabs.map((item) => (
          <button
            key={item.key}
            type="button"
            className={tab === item.key ? 'is-active' : ''}
            aria-current={tab === item.key ? 'page' : undefined}
            onClick={() => setTab(item.key)}
          >
            {t(item.label)}
          </button>
        ))}
      </nav>

      {settingsQuery.isLoading && <p className="state">{t('loading')}</p>}
      {settingsQuery.isError && <p className="state error">{t('loadError')}</p>}

      {settingsQuery.data && (
        <>
          {tab === 'general' && (
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
                  <InputText
                    value={form.clinicName}
                    disabled={disabled}
                    onChange={(event) => updateField('clinicName', event.target.value)}
                  />
                </label>

                <label>
                  <span>{t('patientNumberPrefix')}</span>
                  <InputText
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
                  <InputNumber
                    className="auran-prime-field"
                    min={1}
                    max={720}
                    useGrouping={false}
                    value={form.documentationReminderHours}
                    disabled={disabled}
                    onValueChange={(event) =>
                      updateField('documentationReminderHours', event.value ?? 1)
                    }
                  />
                </label>
              </div>
            </section>
          )}
          {tab === 'branding' && (
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
                  <InputText
                    value={form.logoUrl ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateField('logoUrl', event.target.value)}
                  />
                </label>

                <label>
                  <span>{t('primaryColor')}</span>
                  <InputText
                    value={form.primaryColor ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateField('primaryColor', event.target.value)}
                    placeholder="#1f2937"
                  />
                </label>

                <label>
                  <span>{t('secondaryColor')}</span>
                  <InputText
                    value={form.secondaryColor ?? ''}
                    disabled={disabled}
                    onChange={(event) =>
                      updateField('secondaryColor', event.target.value)
                    }
                    placeholder="#e5e7eb"
                  />
                </label>

                <label>
                  <span>{t('fontFamily')}</span>
                  <InputText
                    value={form.fontFamily ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateField('fontFamily', event.target.value)}
                  />
                </label>

                <label>
                  <span>{t('welcomeButton')}</span>
                  <InputText
                    value={form.welcomeButtonText ?? ''}
                    disabled={disabled}
                    onChange={(event) =>
                      updateField('welcomeButtonText', event.target.value)
                    }
                  />
                </label>

                <label className="full-width">
                  <span>{t('welcomeTitle')}</span>
                  <InputText
                    value={form.welcomeTitle ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateField('welcomeTitle', event.target.value)}
                  />
                </label>

                <label className="full-width">
                  <span>{t('welcomeMessage')}</span>
                  <InputTextarea
                    rows={4}
                    value={form.welcomeMessage ?? ''}
                    disabled={disabled}
                    onChange={(event) =>
                      updateField('welcomeMessage', event.target.value)
                    }
                  />
                </label>
              </div>
            </section>
          )}
          {tab === 'general' && (
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
                  <Dropdown
                    className="auran-prime-field"
                    value={form.timeZoneId ?? ''}
                    disabled={disabled || lookupsQuery.isLoading}
                    options={[
                      { label: t('notConfigured'), value: '' },
                      ...(lookupsQuery.data?.timeZones ?? []).map((timeZone) => ({
                        label: timeZone.displayName,
                        value: timeZone.id,
                      })),
                    ]}
                    optionLabel="label"
                    optionValue="value"
                    filter
                    panelClassName="auran-prime-panel"
                    onChange={(event) => updateField('timeZoneId', event.value as string)}
                  />
                </label>

                <label>
                  <span>{t('locale')}</span>
                  <Dropdown
                    className="auran-prime-field"
                    value={form.locale ?? ''}
                    disabled={disabled || lookupsQuery.isLoading}
                    options={[
                      { label: t('notConfigured'), value: '' },
                      ...(lookupsQuery.data?.locales ?? []).map((locale) => ({
                        label: `${locale.displayName} — ${locale.nativeName}`,
                        value: locale.code,
                      })),
                    ]}
                    optionLabel="label"
                    optionValue="value"
                    filter
                    panelClassName="auran-prime-panel"
                    onChange={(event) => updateField('locale', event.value as string)}
                  />
                </label>

                <label>
                  <span>{t('dateFormat')}</span>
                  <InputText
                    value={form.dateFormat ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateField('dateFormat', event.target.value)}
                    placeholder="dd/MM/yyyy"
                  />
                </label>

                <label>
                  <span>{t('timeFormat')}</span>
                  <InputText
                    value={form.timeFormat ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateField('timeFormat', event.target.value)}
                    placeholder="HH:mm"
                  />
                </label>
              </div>
            </section>
          )}
          {tab === 'general' && (
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
                  <InputText
                    value={form.phone ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateField('phone', event.target.value)}
                  />
                </label>

                <label>
                  <span>{t('email')}</span>
                  <InputText
                    type="email"
                    value={form.email ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateField('email', event.target.value)}
                  />
                </label>

                <label className="full-width">
                  <span>{t('address')}</span>
                  <InputTextarea
                    rows={3}
                    value={form.address ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateField('address', event.target.value)}
                  />
                </label>

                <label className="full-width">
                  <span>{t('website')}</span>
                  <InputText
                    value={form.website ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateField('website', event.target.value)}
                  />
                </label>
              </div>
            </section>
          )}
          {tab === 'orders' && (
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
                  <InputTextarea
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
                  <InputTextarea
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
          )}
          {tab === 'workflow' && <WorkflowConfigurationPanel />}
          {tab === 'medical' && (
            <>
              <PatientProfileConfigurationPanel />
              <ClinicalFieldConfigurationPanel />
            </>
          )}
          {tab === 'orders' && <ClinicalOrderSectionConfigurationPanel />}
          {tab === 'documentation' && <DocumentationPolicyPanel />}

          {canManage && ['general', 'branding', 'orders'].includes(tab) && (
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
