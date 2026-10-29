import './PendingDocumentationEditor.css'
import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InputTextarea } from 'primereact/inputtextarea'
import { DOCUMENTATION_FIELDS } from '../documentationPolicies/api'
import { completePendingDocumentation } from './api'
import type { PendingDocumentation } from './types'

interface Props {
  item: PendingDocumentation
  onClose: () => void
}

export function PendingDocumentationEditor({ item, onClose }: Props) {
  const { t } = useTranslation('pendingDocumentation')
  const queryClient = useQueryClient()
  const [chiefComplaint, setChiefComplaint] = useState(item.chiefComplaint ?? '')
  const [examination, setExamination] = useState(item.examination ?? '')
  const [diagnosis, setDiagnosis] = useState(item.diagnosis ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [treatmentPlan, setTreatmentPlan] = useState(item.treatmentPlan ?? '')
  const mutation = useMutation({
    mutationFn: completePendingDocumentation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pending-documentation'] })
      onClose()
    },
  })

  const missingFields =
    isAxiosError<{ error?: string; data?: string[] }>(mutation.error) &&
    mutation.error.response?.data?.error === 'documentation_required_fields_missing'
      ? (mutation.error.response.data.data ?? [])
      : []
  const fieldNames = new Map<string, string>(
    DOCUMENTATION_FIELDS.map((field) => [
      field.key,
      t(field.key, { defaultValue: field.label }),
    ]),
  )
  const hasContent = [chiefComplaint, examination, diagnosis, notes, treatmentPlan].some(
    (value) => value.trim().length > 0,
  )

  return (
    <div className="pending-editor">
      <p className="pending-editor-patient-number" dir="ltr">
        {item.patientNumber}
      </p>
      <div className="pending-editor-fields">
        <label>
          <span>{t('chiefComplaint')}</span>
          <InputTextarea
            className="auran-prime-field"
            rows={3}
            value={chiefComplaint}
            onChange={(event) => setChiefComplaint(event.target.value)}
          />
        </label>
        <label>
          <span>{t('examination')}</span>
          <InputTextarea
            className="auran-prime-field"
            rows={3}
            value={examination}
            onChange={(event) => setExamination(event.target.value)}
          />
        </label>
        <label>
          <span>{t('diagnosis')}</span>
          <InputTextarea
            className="auran-prime-field"
            rows={3}
            value={diagnosis}
            onChange={(event) => setDiagnosis(event.target.value)}
          />
        </label>
        <label>
          <span>{t('treatmentPlan')}</span>
          <InputTextarea
            className="auran-prime-field"
            rows={3}
            value={treatmentPlan}
            onChange={(event) => setTreatmentPlan(event.target.value)}
          />
        </label>
        <label className="pending-editor-wide">
          <span>{t('clinicalNotes')}</span>
          <InputTextarea
            className="auran-prime-field"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>
      {mutation.isError && (
        <div className="field-error" role="alert">
          {missingFields.length > 0 ? (
            <>
              <p>{t('requiredFields')}</p>
              <ul>
                {missingFields.map((field) => (
                  <li key={field}>{fieldNames.get(field) ?? field}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>{t('completeError')}</p>
          )}
        </div>
      )}
      <div className="pending-editor-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          {t('close')}
        </button>
        <button
          type="button"
          className="button primary"
          disabled={!hasContent || mutation.isPending}
          onClick={() =>
            mutation.mutate({
              visitId: item.visitId,
              chiefComplaint: chiefComplaint || undefined,
              examination: examination || undefined,
              diagnosis: diagnosis || undefined,
              notes: notes || undefined,
              treatmentPlan: treatmentPlan || undefined,
            })
          }
        >
          {mutation.isPending ? t('completing') : t('completeDocumentation')}
        </button>
      </div>
    </div>
  )
}
