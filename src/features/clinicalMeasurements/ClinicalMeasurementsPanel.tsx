import './clinicalMeasurements.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import {
  getClinicalMeasurementFields,
  getClinicalMeasurements,
  recordClinicalMeasurements,
} from './api'
import type {
  ClinicalMeasurement,
  ClinicalMeasurementField,
  RecordClinicalMeasurementValue,
} from './types'

interface ClinicalMeasurementsPanelProps {
  visitId: string
}

interface MeasurementDraft {
  text: string
  number: string
  boolean: '' | 'true' | 'false'
  date: string
  multi: string[]
}

const emptyDraft = (): MeasurementDraft => ({
  text: '',
  number: '',
  boolean: '',
  date: '',
  multi: [],
})

export function ClinicalMeasurementsPanel({ visitId }: ClinicalMeasurementsPanelProps) {
  const { t, i18n } = useTranslation('clinicalMeasurements')
  const auth = useAuth()
  const queryClient = useQueryClient()
  const canView = auth.hasPermission('Visit_View')
  const canEdit = auth.hasPermission('Visit_Edit')
  const [drafts, setDrafts] = useState<Record<string, MeasurementDraft>>({})

  const fieldsQuery = useQuery({
    queryKey: ['clinical-measurement-fields'],
    queryFn: getClinicalMeasurementFields,
    enabled: canView,
  })

  const measurementsQuery = useQuery({
    queryKey: ['clinical-measurements', visitId],
    queryFn: () => getClinicalMeasurements(visitId),
    enabled: canView,
  })

  const fields = useMemo(() => fieldsQuery.data ?? [], [fieldsQuery.data])

  const pendingValues = fields
    .filter((field) => isEditableField(field.fieldType))
    .map((field) => ({
      field,
      draft: drafts[field.id] ?? emptyDraft(),
    }))
    .filter(({ field, draft }) => !isDraftEmpty(field, draft))
    .map(({ field, draft }) => toRecordValue(field, draft))

  const recordMutation = useMutation({
    mutationFn: () => recordClinicalMeasurements(visitId, pendingValues),
    onSuccess: (measurements) => {
      queryClient.setQueryData(['clinical-measurements', visitId], measurements)
      setDrafts({})
    },
  })

  if (!canView) return null

  const updateDraft = (
    fieldId: string,
    updater: (draft: MeasurementDraft) => MeasurementDraft,
  ) => {
    setDrafts((current) => ({
      ...current,
      [fieldId]: updater(current[fieldId] ?? emptyDraft()),
    }))
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t('title')}</h2>
          <p className="muted">{t('subtitle')}</p>
        </div>
      </div>

      {fieldsQuery.isLoading && <p className="state">{t('loadingFields')}</p>}
      {fieldsQuery.isError && <p className="state error">{t('fieldsError')}</p>}

      {fields.length === 0 && !fieldsQuery.isLoading && (
        <p className="state">{t('noFields')}</p>
      )}

      {fields.length > 0 && (
        <div className="clinical-measurement-entry-grid">
          {fields.map((field) => (
            <MeasurementFieldInput
              key={field.id}
              field={field}
              draft={drafts[field.id] ?? emptyDraft()}
              disabled={!canEdit}
              onChange={(updater) => updateDraft(field.id, updater)}
            />
          ))}
        </div>
      )}

      {canEdit && fields.length > 0 && (
        <div className="actions clinical-measurement-actions">
          <button
            className="button primary"
            disabled={pendingValues.length === 0 || recordMutation.isPending}
            onClick={() => recordMutation.mutate()}
          >
            {recordMutation.isPending ? t('recording') : t('record')}
          </button>
        </div>
      )}

      {recordMutation.isError && <p className="field-error">{t('recordError')}</p>}

      <div className="clinical-measurement-history">
        <h3>{t('historyTitle')}</h3>

        {measurementsQuery.isLoading && <p className="state">{t('loadingHistory')}</p>}
        {measurementsQuery.isError && <p className="state error">{t('historyError')}</p>}
        {measurementsQuery.data?.length === 0 && (
          <p className="state">{t('noHistory')}</p>
        )}

        {measurementsQuery.data && measurementsQuery.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('measurement')}</th>
                  <th>{t('value')}</th>
                  <th>{t('recorded')}</th>
                </tr>
              </thead>
              <tbody>
                {measurementsQuery.data.map((measurement) => (
                  <tr key={measurement.id}>
                    <td>{measurement.fieldName}</td>
                    <td>{formatMeasurement(measurement, fields, t('yes'), t('no'))}</td>
                    <td>
                      {new Date(measurement.recordedAtUtc).toLocaleString(i18n.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function MeasurementFieldInput({
  field,
  draft,
  disabled,
  onChange,
}: {
  field: ClinicalMeasurementField
  draft: MeasurementDraft
  disabled: boolean
  onChange: (updater: (draft: MeasurementDraft) => MeasurementDraft) => void
}) {
  const { t } = useTranslation('clinicalMeasurements')
  const label = field.unit ? `${field.name} (${field.unit})` : field.name

  switch (field.fieldType) {
    case 'Text':
      return (
        <label>
          <span>{label}</span>
          <input
            value={draft.text}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({ ...current, text: event.target.value }))
            }
          />
        </label>
      )

    case 'LongText':
      return (
        <label className="full-width">
          <span>{label}</span>
          <textarea
            rows={3}
            value={draft.text}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({ ...current, text: event.target.value }))
            }
          />
        </label>
      )

    case 'Number':
      return (
        <label>
          <span>{label}</span>
          <input
            type="number"
            value={draft.number}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({ ...current, number: event.target.value }))
            }
          />
        </label>
      )

    case 'Boolean':
      return (
        <label>
          <span>{label}</span>
          <select
            value={draft.boolean}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                boolean: event.target.value as MeasurementDraft['boolean'],
              }))
            }
          >
            <option value="">{t('notRecorded')}</option>
            <option value="true">{t('yes')}</option>
            <option value="false">{t('no')}</option>
          </select>
        </label>
      )

    case 'Date':
      return (
        <label>
          <span>{label}</span>
          <input
            type="date"
            value={draft.date}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({ ...current, date: event.target.value }))
            }
          />
        </label>
      )

    case 'SingleSelect':
      return (
        <label>
          <span>{label}</span>
          <select
            value={draft.text}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({ ...current, text: event.target.value }))
            }
          >
            <option value="">{t('notRecorded')}</option>
            {field.options.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )

    case 'MultiSelect':
      return (
        <fieldset className="dynamic-multi-select">
          <legend>{label}</legend>
          <div className="dynamic-option-list">
            {field.options.map((option) => {
              const checked = draft.multi.includes(option.value)
              return (
                <label className="dynamic-option" key={option.id}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() =>
                      onChange((current) => ({
                        ...current,
                        multi: checked
                          ? current.multi.filter((value) => value !== option.value)
                          : [...current.multi, option.value],
                      }))
                    }
                  />
                  <span>{option.label}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )

    default:
      return (
        <div className="dynamic-file-field">
          <span className="profile-label">{label}</span>
          <strong>{t('notRecordable')}</strong>
          <p className="muted">{t('attachmentRequired')}</p>
        </div>
      )
  }
}

function toRecordValue(
  field: ClinicalMeasurementField,
  draft: MeasurementDraft,
): RecordClinicalMeasurementValue {
  const base = { fieldId: field.id }

  switch (field.fieldType) {
    case 'Text':
    case 'LongText':
    case 'SingleSelect':
      return { ...base, textValue: draft.text.trim() }
    case 'Number':
      return { ...base, numberValue: Number(draft.number) }
    case 'Boolean':
      return { ...base, booleanValue: draft.boolean === 'true' }
    case 'Date':
      return { ...base, dateValue: draft.date }
    case 'MultiSelect':
      return { ...base, jsonValue: JSON.stringify(draft.multi) }
    default:
      return base
  }
}

function isEditableField(fieldType: string) {
  return [
    'Text',
    'LongText',
    'Number',
    'Boolean',
    'Date',
    'SingleSelect',
    'MultiSelect',
  ].includes(fieldType)
}

function isDraftEmpty(field: ClinicalMeasurementField, draft: MeasurementDraft) {
  switch (field.fieldType) {
    case 'Text':
    case 'LongText':
    case 'SingleSelect':
      return draft.text.trim().length === 0
    case 'Number':
      return draft.number === ''
    case 'Boolean':
      return draft.boolean === ''
    case 'Date':
      return draft.date === ''
    case 'MultiSelect':
      return draft.multi.length === 0
    default:
      return true
  }
}

function formatMeasurement(
  measurement: ClinicalMeasurement,
  fields: ClinicalMeasurementField[],
  yes: string,
  no: string,
) {
  const field = fields.find((item) => item.id === measurement.clinicalFieldId)

  if (measurement.numberValue != null) {
    return field?.unit
      ? `${measurement.numberValue} ${field.unit}`
      : String(measurement.numberValue)
  }

  if (measurement.booleanValue != null) {
    return measurement.booleanValue ? yes : no
  }

  if (measurement.dateValue) return measurement.dateValue

  if (measurement.jsonValue) {
    try {
      const values = JSON.parse(measurement.jsonValue)
      if (Array.isArray(values)) {
        return values
          .map(
            (value) =>
              field?.options.find((option) => option.value === value)?.label ??
              String(value),
          )
          .join(', ')
      }
    } catch {
      return measurement.jsonValue
    }
  }

  if (measurement.textValue) {
    return (
      field?.options.find((option) => option.value === measurement.textValue)?.label ??
      measurement.textValue
    )
  }

  return '—'
}
