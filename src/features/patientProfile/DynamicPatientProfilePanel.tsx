import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  getPatientProfile,
  getPatientProfileConfiguration,
  savePatientProfile,
} from './api'
import type {
  PatientProfileField,
  PatientProfileValue,
  SavePatientProfileValue,
} from './types'

interface DynamicPatientProfilePanelProps {
  patientId: string
}

interface FieldDraft {
  text: string
  number: string
  boolean: '' | 'true' | 'false'
  date: string
  multi: string[]
  fileId?: string
}

const emptyDraft = (): FieldDraft => ({
  text: '',
  number: '',
  boolean: '',
  date: '',
  multi: [],
})

export function DynamicPatientProfilePanel({
  patientId,
}: DynamicPatientProfilePanelProps) {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const canEdit = auth.hasPermission('Patient_Edit_Basic')
  const [drafts, setDrafts] = useState<Record<string, FieldDraft>>({})

  const configurationQuery = useQuery({
    queryKey: ['patient-profile-configuration'],
    queryFn: getPatientProfileConfiguration,
  })

  const profileQuery = useQuery({
    queryKey: ['patient-profile', patientId],
    queryFn: () => getPatientProfile(patientId),
  })

  const fields = useMemo(
    () => configurationQuery.data?.sections.flatMap((section) => section.fields) ?? [],
    [configurationQuery.data],
  )

  useEffect(() => {
    if (!configurationQuery.data || !profileQuery.data) return

    const valueMap = new Map(
      profileQuery.data.values.map((value) => [value.fieldId, value]),
    )

    const next: Record<string, FieldDraft> = {}
    for (const field of fields) {
      next[field.id] = fromValue(valueMap.get(field.id))
    }

    setDrafts(next)
  }, [configurationQuery.data, profileQuery.data, fields])

  const saveMutation = useMutation({
    mutationFn: () =>
      savePatientProfile({
        patientId,
        values: fields
          .filter((field) => isEditableField(field.fieldType))
          .map((field) => toSaveValue(field, drafts[field.id] ?? emptyDraft())),
      }),
    onSuccess: (profile) => {
      queryClient.setQueryData(['patient-profile', patientId], profile)
    },
  })

  if (configurationQuery.isLoading || profileQuery.isLoading) {
    return (
      <section className="panel">
        <p className="state">Loading patient profile fields…</p>
      </section>
    )
  }

  if (configurationQuery.isError || profileQuery.isError) {
    return (
      <section className="panel">
        <p className="state error">Unable to load dynamic patient profile.</p>
      </section>
    )
  }

  const sections = configurationQuery.data?.sections ?? []
  if (sections.length === 0) {
    return null
  }

  const missingRequired = fields.some((field) => {
    if (!field.isRequired || !isEditableField(field.fieldType)) return false
    return isDraftEmpty(field, drafts[field.id] ?? emptyDraft())
  })

  const updateDraft = (
    fieldId: string,
    updater: (draft: FieldDraft) => FieldDraft,
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
          <h2>Extended patient profile</h2>
          <p className="muted">
            Clinic-configured fields for demographic and operational patient information.
          </p>
        </div>
      </div>

      <div className="dynamic-profile-sections">
        {sections.map((section) => (
          <section className="dynamic-profile-section" key={section.id}>
            <div className="dynamic-profile-section-heading">
              <h3>{section.name}</h3>
              {section.isSystem && <span className="role-badge">System</span>}
            </div>

            <div className="dynamic-profile-grid">
              {section.fields.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  draft={drafts[field.id] ?? emptyDraft()}
                  disabled={!canEdit}
                  onChange={(updater) => updateDraft(field.id, updater)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {canEdit && (
        <div className="actions dynamic-profile-actions">
          <button
            className="button primary"
            disabled={saveMutation.isPending || missingRequired}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save extended profile'}
          </button>
        </div>
      )}

      {missingRequired && canEdit && (
        <p className="field-error">Complete all required profile fields before saving.</p>
      )}

      {saveMutation.isSuccess && (
        <p className="state">Extended patient profile saved.</p>
      )}

      {saveMutation.isError && (
        <p className="field-error">
          Unable to save the extended profile. Check required values and configured options.
        </p>
      )}
    </section>
  )
}

function DynamicField({
  field,
  draft,
  disabled,
  onChange,
}: {
  field: PatientProfileField
  draft: FieldDraft
  disabled: boolean
  onChange: (updater: (draft: FieldDraft) => FieldDraft) => void
}) {
  const label = (
    <span>
      {field.label}
      {field.isRequired && <span aria-hidden="true"> *</span>}
    </span>
  )

  switch (field.fieldType) {
    case 'Text':
      return (
        <label>
          {label}
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
          {label}
          <textarea
            rows={4}
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
          {label}
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
          {label}
          <select
            value={draft.boolean}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                boolean: event.target.value as FieldDraft['boolean'],
              }))
            }
          >
            <option value="">Not specified</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      )

    case 'Date':
      return (
        <label>
          {label}
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
          {label}
          <select
            value={draft.text}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({ ...current, text: event.target.value }))
            }
          >
            <option value="">Not specified</option>
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

    case 'Image':
    case 'File':
      return (
        <div className="dynamic-file-field">
          <span className="profile-label">{field.label}</span>
          <strong>{draft.fileId ? 'File attached' : 'No file attached'}</strong>
          <p className="muted">Managed through patient attachments in this MVP slice.</p>
        </div>
      )

    default:
      return (
        <div>
          <span className="profile-label">{field.label}</span>
          <strong>Unsupported field type</strong>
        </div>
      )
  }
}

function fromValue(value?: PatientProfileValue): FieldDraft {
  if (!value) return emptyDraft()

  let multi: string[] = []
  if (value.jsonValue) {
    try {
      const parsed = JSON.parse(value.jsonValue)
      if (Array.isArray(parsed)) {
        multi = parsed.filter((item): item is string => typeof item === 'string')
      }
    } catch {
      multi = []
    }
  }

  return {
    text: value.textValue ?? '',
    number: value.numberValue == null ? '' : String(value.numberValue),
    boolean:
      value.booleanValue == null ? '' : value.booleanValue ? 'true' : 'false',
    date: value.dateValue ?? '',
    multi,
    fileId: value.fileId ?? undefined,
  }
}

function toSaveValue(
  field: PatientProfileField,
  draft: FieldDraft,
): SavePatientProfileValue {
  const base = { fieldId: field.id }

  switch (field.fieldType) {
    case 'Text':
    case 'LongText':
    case 'SingleSelect':
      return {
        ...base,
        textValue: draft.text.trim() || undefined,
      }

    case 'Number':
      return {
        ...base,
        numberValue: draft.number === '' ? undefined : Number(draft.number),
      }

    case 'Boolean':
      return {
        ...base,
        booleanValue:
          draft.boolean === '' ? undefined : draft.boolean === 'true',
      }

    case 'Date':
      return {
        ...base,
        dateValue: draft.date || undefined,
      }

    case 'MultiSelect':
      return {
        ...base,
        jsonValue:
          draft.multi.length === 0
            ? undefined
            : JSON.stringify(draft.multi),
      }

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

function isDraftEmpty(field: PatientProfileField, draft: FieldDraft) {
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
      return false
  }
}
