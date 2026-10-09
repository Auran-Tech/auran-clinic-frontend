import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import {
  createClinicalField,
  createClinicalFieldOption,
  deleteClinicalFieldOption,
  getClinicalFieldAdminConfiguration,
  updateClinicalField,
  updateClinicalFieldOption,
} from './api'
import type {
  ClinicalFieldAdminConfiguration,
  ClinicalFieldAdminField,
  ClinicalFieldAdminOption,
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

export function ClinicalFieldConfigurationPanel() {
  const auth = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const canView = auth.hasPermission('Settings_View')
  const canManage = auth.hasPermission('Settings_Manage')

  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState('Number')
  const [unit, setUnit] = useState('')
  const [sortOrder, setSortOrder] = useState(0)

  const query = useQuery({
    queryKey: ['clinical-field-admin-configuration'],
    queryFn: getClinicalFieldAdminConfiguration,
    enabled: canView,
  })

  const applyConfiguration = (configuration: ClinicalFieldAdminConfiguration) => {
    queryClient.setQueryData(['clinical-field-admin-configuration'], configuration)
    void queryClient.invalidateQueries({ queryKey: ['clinical-measurement-fields'] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createClinicalField({
        name: name.trim(),
        fieldType,
        unit: unit.trim() || undefined,
        sortOrder,
      }),
    onSuccess: (configuration) => {
      applyConfiguration(configuration)
      setName('')
      setFieldType('Number')
      setUnit('')
      setSortOrder(0)
    },
  })

  if (!canView) return null

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t('adminConfig.clinicalFields.title')}</h2>
          <p className="muted">
            {t('adminConfig.clinicalFields.intro')}
          </p>
        </div>
      </div>

      {query.isLoading && <p className="state">{t('adminConfig.clinicalFields.loading')}</p>}
      {query.isError && <p className="state error">{t('adminConfig.clinicalFields.loadError')}</p>}

      {canManage && (
        <div className="profile-config-create-row">
          <label>
            <span>{t('adminConfig.clinicalFields.newField')}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span>{t('adminConfig.type')}</span>
            <select value={fieldType} onChange={(event) => setFieldType(event.target.value)}>
              {fieldTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('adminConfig.unit')}</span>
            <input
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder="e.g. mmHg"
            />
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
              disabled={!name.trim() || sortOrder < 0 || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? t('adminConfig.adding') : t('adminConfig.clinicalFields.addField')}
            </button>
          </div>
        </div>
      )}

      {createMutation.isError && (
        <p className="field-error">{t('adminConfig.clinicalFields.createError')}</p>
      )}

      <div className="profile-config-fields">
        {(query.data?.fields ?? []).map((field) => (
          <ClinicalFieldEditor
            key={field.id}
            field={field}
            canManage={canManage}
            onConfiguration={applyConfiguration}
          />
        ))}
      </div>

      {query.data?.fields.length === 0 && (
        <p className="state">{t('adminConfig.clinicalFields.empty')}</p>
      )}
    </section>
  )
}

function ClinicalFieldEditor({
  field,
  canManage,
  onConfiguration,
}: {
  field: ClinicalFieldAdminField
  canManage: boolean
  onConfiguration: (configuration: ClinicalFieldAdminConfiguration) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(field.name)
  const [fieldType, setFieldType] = useState(field.fieldType)
  const [unit, setUnit] = useState(field.unit ?? '')
  const [isEnabled, setIsEnabled] = useState(field.isEnabled)
  const [sortOrder, setSortOrder] = useState(field.sortOrder)

  const [optionLabel, setOptionLabel] = useState('')
  const [optionValue, setOptionValue] = useState('')
  const [optionSortOrder, setOptionSortOrder] = useState(0)

  useEffect(() => {
    setName(field.name)
    setFieldType(field.fieldType)
    setUnit(field.unit ?? '')
    setIsEnabled(field.isEnabled)
    setSortOrder(field.sortOrder)
  }, [field])

  const updateMutation = useMutation({
    mutationFn: () =>
      updateClinicalField(field.id, {
        name: name.trim(),
        fieldType,
        unit: unit.trim() || undefined,
        isEnabled,
        sortOrder,
      }),
    onSuccess: onConfiguration,
  })

  const createOptionMutation = useMutation({
    mutationFn: () =>
      createClinicalFieldOption(field.id, {
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
    <article className="profile-config-field-card">
      <div className="profile-config-field-heading">
        <div>
          <strong>{field.name}</strong>
          <div className="role-badges">
            <span className="role-badge">{field.fieldType}</span>
            {field.unit && <span className="role-badge">{field.unit}</span>}
            {!field.isEnabled && <span className="role-badge">{t('adminConfig.disabled')}</span>}
            {field.hasMeasurements && <span className="role-badge">{t('adminConfig.hasHistory')}</span>}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="profile-config-field-form">
          <label>
            <span>{t('adminConfig.name')}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span>{t('adminConfig.type')}</span>
            <select
              value={fieldType}
              disabled={field.hasMeasurements}
              onChange={(event) => setFieldType(event.target.value)}
            >
              {fieldTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('adminConfig.unit')}</span>
            <input value={unit} onChange={(event) => setUnit(event.target.value)} />
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
              onChange={(event) => setIsEnabled(event.target.checked)}
            />
            <span>{t('adminConfig.enabled')}</span>
          </label>
          <div className="actions">
            <button
              className="button secondary"
              disabled={!name.trim() || sortOrder < 0 || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? t('adminConfig.saving') : t('adminConfig.save')}
            </button>
          </div>
        </div>
      )}

      {field.hasMeasurements && canManage && (
        <p className="muted">
          {t('adminConfig.clinicalFields.typeLocked')}
        </p>
      )}

      {updateMutation.isError && (
        <p className="field-error">{t('adminConfig.clinicalFields.updateError')}</p>
      )}

      {isSelect && (
        <div className="profile-config-options">
          <div className="profile-config-options-heading">
            <strong>{t('adminConfig.options')}</strong>
            {field.hasMeasurements && (
              <span className="muted">
                {t('adminConfig.clinicalFields.optionLocked')}
              </span>
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
                  {createOptionMutation.isPending ? t('adminConfig.adding') : t('adminConfig.clinicalFields.addOption')}
                </button>
              </div>
            </div>
          )}

          {createOptionMutation.isError && (
            <p className="field-error">{t('adminConfig.clinicalFields.addOptionError')}</p>
          )}

          <div className="profile-config-option-list">
            {field.options.map((option) => (
              <ClinicalFieldOptionEditor
                key={option.id}
                option={option}
                hasMeasurements={field.hasMeasurements}
                canManage={canManage}
                onConfiguration={onConfiguration}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

function ClinicalFieldOptionEditor({
  option,
  hasMeasurements,
  canManage,
  onConfiguration,
}: {
  option: ClinicalFieldAdminOption
  hasMeasurements: boolean
  canManage: boolean
  onConfiguration: (configuration: ClinicalFieldAdminConfiguration) => void
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
      updateClinicalFieldOption(option.id, {
        label: label.trim(),
        value: value.trim(),
        sortOrder,
      }),
    onSuccess: onConfiguration,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteClinicalFieldOption(option.id),
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
        disabled={hasMeasurements}
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
          disabled={hasMeasurements || deleteMutation.isPending}
          onClick={() => deleteMutation.mutate()}
        >
          {t('adminConfig.delete')}
        </button>
      </div>

      {(updateMutation.isError || deleteMutation.isError) && (
        <p className="field-error full-width">
          {t('adminConfig.clinicalFields.optionChangeError')}
        </p>
      )}
    </div>
  )
}
