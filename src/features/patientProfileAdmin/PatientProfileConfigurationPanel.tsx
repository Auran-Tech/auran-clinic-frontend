import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import {
  createPatientProfileField,
  createPatientProfileOption,
  createPatientProfileSection,
  deletePatientProfileOption,
  getPatientProfileAdminConfiguration,
  updatePatientProfileField,
  updatePatientProfileOption,
  updatePatientProfileSection,
} from './api'
import type {
  PatientProfileAdminConfiguration,
  PatientProfileAdminField,
  PatientProfileAdminOption,
  PatientProfileAdminSection,
} from './types'

const fieldTypes = [
  'Text',
  'LongText',
  'Number',
  'Boolean',
  'Date',
  'Image',
  'File',
  'SingleSelect',
  'MultiSelect',
]

export function PatientProfileConfigurationPanel() {
  const auth = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const canView = auth.hasPermission('Settings_View')
  const canManage = auth.hasPermission('Settings_Manage')
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState(0)

  const query = useQuery({
    queryKey: ['patient-profile-admin-configuration'],
    queryFn: getPatientProfileAdminConfiguration,
    enabled: canView,
  })

  const applyConfiguration = (configuration: PatientProfileAdminConfiguration) => {
    queryClient.setQueryData(['patient-profile-admin-configuration'], configuration)
    void queryClient.invalidateQueries({ queryKey: ['patient-profile-configuration'] })
  }

  const createSectionMutation = useMutation({
    mutationFn: createPatientProfileSection,
    onSuccess: (configuration) => {
      applyConfiguration(configuration)
      setName('')
      setSortOrder(0)
    },
  })

  if (!canView) return null

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t('adminConfig.patientProfile.title')}</h2>
          <p className="muted">
            {t('adminConfig.patientProfile.intro')}
          </p>
        </div>
      </div>

      {query.isLoading && <p className="state">{t('adminConfig.patientProfile.loading')}</p>}
      {query.isError && <p className="state error">{t('adminConfig.patientProfile.loadError')}</p>}

      {canManage && (
        <div className="profile-config-create-row">
          <label>
            <span>{t('adminConfig.patientProfile.newSection')}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span>{t('adminConfig.sortOrder')}</span>
            <input
              type="number"
              min="0"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
            />
          </label>
          <div className="actions">
            <button
              className="button primary"
              disabled={!name.trim() || sortOrder < 0 || createSectionMutation.isPending}
              onClick={() =>
                createSectionMutation.mutate({
                  name: name.trim(),
                  sortOrder,
                })
              }
            >
              {createSectionMutation.isPending ? t('adminConfig.adding') : t('adminConfig.patientProfile.addSection')}
            </button>
          </div>
        </div>
      )}

      {createSectionMutation.isError && (
        <p className="field-error">{t('adminConfig.patientProfile.createSectionError')}</p>
      )}

      <div className="profile-config-sections">
        {(query.data?.sections ?? []).map((section) => (
          <SectionEditor
            key={section.id}
            section={section}
            canManage={canManage}
            onConfiguration={applyConfiguration}
          />
        ))}
      </div>

      {query.data?.sections.length === 0 && (
        <p className="state">{t('adminConfig.patientProfile.empty')}</p>
      )}
    </section>
  )
}

function SectionEditor({
  section,
  canManage,
  onConfiguration,
}: {
  section: PatientProfileAdminSection
  canManage: boolean
  onConfiguration: (configuration: PatientProfileAdminConfiguration) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(section.name)
  const [sortOrder, setSortOrder] = useState(section.sortOrder)
  const [isEnabled, setIsEnabled] = useState(section.isEnabled)

  const [fieldLabel, setFieldLabel] = useState('')
  const [fieldType, setFieldType] = useState('Text')
  const [fieldRequired, setFieldRequired] = useState(false)
  const [fieldSortOrder, setFieldSortOrder] = useState(0)

  useEffect(() => {
    setName(section.name)
    setSortOrder(section.sortOrder)
    setIsEnabled(section.isEnabled)
  }, [section])

  const sectionMutation = useMutation({
    mutationFn: () =>
      updatePatientProfileSection(section.id, {
        name: name.trim(),
        sortOrder,
        isEnabled,
      }),
    onSuccess: onConfiguration,
  })

  const fieldMutation = useMutation({
    mutationFn: () =>
      createPatientProfileField({
        sectionId: section.id,
        label: fieldLabel.trim(),
        fieldType,
        isRequired: fieldRequired,
        sortOrder: fieldSortOrder,
      }),
    onSuccess: (configuration) => {
      onConfiguration(configuration)
      setFieldLabel('')
      setFieldType('Text')
      setFieldRequired(false)
      setFieldSortOrder(0)
    },
  })

  return (
    <article className="profile-config-section-card">
      <div className="profile-config-section-header">
        <div>
          <h3>{section.name}</h3>
          <div className="role-badges">
            {section.isSystem && <span className="role-badge">{t('adminConfig.system')}</span>}
            {!section.isEnabled && <span className="role-badge">{t('adminConfig.disabled')}</span>}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="profile-config-section-form">
          <label>
            <span>{t('adminConfig.patientProfile.sectionName')}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span>{t('adminConfig.sortOrder')}</span>
            <input
              type="number"
              min="0"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
            />
          </label>
          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={isEnabled}
              disabled={section.isSystem}
              onChange={(event) => setIsEnabled(event.target.checked)}
            />
            <span>{t('adminConfig.enabled')}</span>
          </label>
          <div className="actions">
            <button
              className="button secondary"
              disabled={!name.trim() || sortOrder < 0 || sectionMutation.isPending}
              onClick={() => sectionMutation.mutate()}
            >
              {sectionMutation.isPending ? t('adminConfig.saving') : t('adminConfig.patientProfile.saveSection')}
            </button>
          </div>
        </div>
      )}

      {sectionMutation.isError && (
        <p className="field-error">{t('adminConfig.patientProfile.updateSectionError')}</p>
      )}

      {canManage && (
        <div className="profile-config-new-field">
          <label>
            <span>{t('adminConfig.patientProfile.newField')}</span>
            <input
              value={fieldLabel}
              onChange={(event) => setFieldLabel(event.target.value)}
            />
          </label>
          <label>
            <span>{t('adminConfig.patientProfile.fieldType')}</span>
            <select value={fieldType} onChange={(event) => setFieldType(event.target.value)}>
              {fieldTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('adminConfig.sortOrder')}</span>
            <input
              type="number"
              min="0"
              value={fieldSortOrder}
              onChange={(event) => setFieldSortOrder(Number(event.target.value))}
            />
          </label>
          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={fieldRequired}
              onChange={(event) => setFieldRequired(event.target.checked)}
            />
            <span>{t('adminConfig.required')}</span>
          </label>
          <div className="actions">
            <button
              className="button primary"
              disabled={!fieldLabel.trim() || fieldSortOrder < 0 || fieldMutation.isPending}
              onClick={() => fieldMutation.mutate()}
            >
              {fieldMutation.isPending ? t('adminConfig.adding') : t('adminConfig.patientProfile.addField')}
            </button>
          </div>
        </div>
      )}

      {fieldMutation.isError && (
        <p className="field-error">{t('adminConfig.patientProfile.addFieldError')}</p>
      )}

      <div className="profile-config-fields">
        {section.fields.map((field) => (
          <FieldEditor
            key={field.id}
            field={field}
            canManage={canManage}
            onConfiguration={onConfiguration}
          />
        ))}
      </div>

      {section.fields.length === 0 && (
        <p className="muted">{t('adminConfig.patientProfile.noFields')}</p>
      )}
    </article>
  )
}

function FieldEditor({
  field,
  canManage,
  onConfiguration,
}: {
  field: PatientProfileAdminField
  canManage: boolean
  onConfiguration: (configuration: PatientProfileAdminConfiguration) => void
}) {
  const { t } = useTranslation()
  const [label, setLabel] = useState(field.label)
  const [fieldType, setFieldType] = useState(field.fieldType)
  const [isRequired, setIsRequired] = useState(field.isRequired)
  const [isEnabled, setIsEnabled] = useState(field.isEnabled)
  const [sortOrder, setSortOrder] = useState(field.sortOrder)

  const [optionLabel, setOptionLabel] = useState('')
  const [optionValue, setOptionValue] = useState('')
  const [optionSortOrder, setOptionSortOrder] = useState(0)

  useEffect(() => {
    setLabel(field.label)
    setFieldType(field.fieldType)
    setIsRequired(field.isRequired)
    setIsEnabled(field.isEnabled)
    setSortOrder(field.sortOrder)
  }, [field])

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePatientProfileField(field.id, {
        sectionId: field.sectionId,
        label: label.trim(),
        fieldType,
        isRequired,
        isEnabled,
        sortOrder,
      }),
    onSuccess: onConfiguration,
  })

  const createOptionMutation = useMutation({
    mutationFn: () =>
      createPatientProfileOption(field.id, {
        label: optionLabel.trim(),
        value: optionValue.trim(),
        sortOrder: optionSortOrder,
      }),
    onSuccess: (configuration) => {
      onConfiguration(configuration)
      setOptionLabel('')
      setOptionValue('')
      setOptionSortOrder(0)
    },
  })

  const isSelect = field.fieldType === 'SingleSelect' || field.fieldType === 'MultiSelect'

  return (
    <div className="profile-config-field-card">
      <div className="profile-config-field-heading">
        <div>
          <strong>{field.label}</strong>
          <div className="role-badges">
            <span className="role-badge">{field.fieldType}</span>
            {field.isRequired && <span className="role-badge">{t('adminConfig.required')}</span>}
            {!field.isEnabled && <span className="role-badge">{t('adminConfig.disabled')}</span>}
            {field.hasValues && <span className="role-badge">{t('adminConfig.hasValues')}</span>}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="profile-config-field-form">
          <label>
            <span>{t('adminConfig.label')}</span>
            <input value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <label>
            <span>{t('adminConfig.type')}</span>
            <select
              value={fieldType}
              disabled={field.hasValues}
              onChange={(event) => setFieldType(event.target.value)}
            >
              {fieldTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('adminConfig.sortOrder')}</span>
            <input
              type="number"
              min="0"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
            />
          </label>
          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(event) => setIsRequired(event.target.checked)}
            />
            <span>{t('adminConfig.required')}</span>
          </label>
          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(event) => setIsEnabled(event.target.checked)}
            />
            <span>{t('adminConfig.enabled')}</span>
          </label>
          <div className="actions">
            <button
              className="button secondary"
              disabled={!label.trim() || sortOrder < 0 || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? t('adminConfig.saving') : t('adminConfig.save')}
            </button>
          </div>
        </div>
      )}

      {field.hasValues && canManage && (
        <p className="muted">
          {t('adminConfig.patientProfile.typeLocked')}
        </p>
      )}

      {updateMutation.isError && (
        <p className="field-error">{t('adminConfig.patientProfile.updateFieldError')}</p>
      )}

      {isSelect && (
        <div className="profile-config-options">
          <div className="profile-config-options-heading">
            <strong>{t('adminConfig.options')}</strong>
            {field.hasValues && (
              <span className="muted">{t('adminConfig.patientProfile.optionLocked')}</span>
            )}
          </div>

          {canManage && (
            <div className="profile-config-option-form">
              <label>
                <span>{t('adminConfig.label')}</span>
                <input
                  value={optionLabel}
                  onChange={(event) => setOptionLabel(event.target.value)}
                />
              </label>
              <label>
                <span>{t('adminConfig.value')}</span>
                <input
                  value={optionValue}
                  onChange={(event) => setOptionValue(event.target.value)}
                />
              </label>
              <label>
                <span>{t('adminConfig.order')}</span>
                <input
                  type="number"
                  min="0"
                  value={optionSortOrder}
                  onChange={(event) => setOptionSortOrder(Number(event.target.value))}
                />
              </label>
              <div className="actions">
                <button
                  className="button secondary"
                  disabled={
                    !optionLabel.trim() ||
                    !optionValue.trim() ||
                    optionSortOrder < 0 ||
                    createOptionMutation.isPending
                  }
                  onClick={() => createOptionMutation.mutate()}
                >
                  {createOptionMutation.isPending ? t('adminConfig.adding') : t('adminConfig.patientProfile.addOption')}
                </button>
              </div>
            </div>
          )}

          {createOptionMutation.isError && (
            <p className="field-error">{t('adminConfig.patientProfile.addOptionError')}</p>
          )}

          <div className="profile-config-option-list">
            {field.options.map((option) => (
              <OptionEditor
                key={option.id}
                option={option}
                fieldHasValues={field.hasValues}
                canManage={canManage}
                onConfiguration={onConfiguration}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OptionEditor({
  option,
  fieldHasValues,
  canManage,
  onConfiguration,
}: {
  option: PatientProfileAdminOption
  fieldHasValues: boolean
  canManage: boolean
  onConfiguration: (configuration: PatientProfileAdminConfiguration) => void
}) {
  const { t } = useTranslation()
  const [label, setLabel] = useState(option.label)
  const [value, setValue] = useState(option.value)
  const [sortOrder, setSortOrder] = useState(option.sortOrder)

  useEffect(() => {
    setLabel(option.label)
    setValue(option.value)
    setSortOrder(option.sortOrder)
  }, [option])

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePatientProfileOption(option.id, {
        label: label.trim(),
        value: value.trim(),
        sortOrder,
      }),
    onSuccess: onConfiguration,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePatientProfileOption(option.id),
    onSuccess: onConfiguration,
  })

  if (!canManage) {
    return (
      <div className="profile-config-option-readonly">
        <strong>{option.label}</strong>
        <span className="muted mono">{option.value}</span>
      </div>
    )
  }

  return (
    <div className="profile-config-option-editor">
      <input
        aria-label={t('adminConfig.label')}
        value={label}
        onChange={(event) => setLabel(event.target.value)}
      />
      <input
        aria-label={t('adminConfig.value')}
        value={value}
        disabled={fieldHasValues}
        onChange={(event) => setValue(event.target.value)}
      />
      <input
        aria-label={t('adminConfig.sortOrder')}
        type="number"
        min="0"
        value={sortOrder}
        onChange={(event) => setSortOrder(Number(event.target.value))}
      />
      <div className="actions">
        <button
          className="button secondary"
          disabled={!label.trim() || !value.trim() || sortOrder < 0 || updateMutation.isPending}
          onClick={() => updateMutation.mutate()}
        >
          {t('adminConfig.save')}
        </button>
        <button
          className="button danger"
          disabled={fieldHasValues || deleteMutation.isPending}
          onClick={() => deleteMutation.mutate()}
        >
          {t('adminConfig.delete')}
        </button>
      </div>
      {(updateMutation.isError || deleteMutation.isError) && (
        <p className="field-error full-width">
          {t('adminConfig.patientProfile.optionChangeError')}
        </p>
      )}
    </div>
  )
}
