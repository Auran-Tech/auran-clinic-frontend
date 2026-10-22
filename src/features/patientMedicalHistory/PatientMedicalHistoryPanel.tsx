import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import {
  addPatientAllergy,
  addPatientCondition,
  addPatientMedication,
  deletePatientAllergy,
  deletePatientCondition,
  deletePatientMedication,
  getPatientMedicalHistory,
} from './api'
import type { PatientMedicalHistory } from './types'

export function PatientMedicalHistoryPanel({ patientId }: { patientId: string }) {
  const { t } = useTranslation('patientMedicalHistory')
  const auth = useAuth()
  const queryClient = useQueryClient()
  const canEdit = auth.hasPermission('Patient_Edit_Basic')

  const [conditionName, setConditionName] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')

  const [allergyName, setAllergyName] = useState('')
  const [allergyReaction, setAllergyReaction] = useState('')
  const [allergyNotes, setAllergyNotes] = useState('')

  const [medicationName, setMedicationName] = useState('')
  const [medicationDosage, setMedicationDosage] = useState('')
  const [medicationNotes, setMedicationNotes] = useState('')

  const query = useQuery({
    queryKey: ['patient-medical-history', patientId],
    queryFn: () => getPatientMedicalHistory(patientId),
  })

  const applyHistory = (history: PatientMedicalHistory) => {
    queryClient.setQueryData(['patient-medical-history', patientId], history)
  }

  const conditionMutation = useMutation({
    mutationFn: () =>
      addPatientCondition({
        patientId,
        name: conditionName.trim(),
        notes: conditionNotes.trim() || undefined,
      }),
    onSuccess: (history) => {
      applyHistory(history)
      setConditionName('')
      setConditionNotes('')
    },
  })

  const allergyMutation = useMutation({
    mutationFn: () =>
      addPatientAllergy({
        patientId,
        name: allergyName.trim(),
        reaction: allergyReaction.trim() || undefined,
        notes: allergyNotes.trim() || undefined,
      }),
    onSuccess: (history) => {
      applyHistory(history)
      setAllergyName('')
      setAllergyReaction('')
      setAllergyNotes('')
    },
  })

  const medicationMutation = useMutation({
    mutationFn: () =>
      addPatientMedication({
        patientId,
        name: medicationName.trim(),
        dosage: medicationDosage.trim() || undefined,
        notes: medicationNotes.trim() || undefined,
      }),
    onSuccess: (history) => {
      applyHistory(history)
      setMedicationName('')
      setMedicationDosage('')
      setMedicationNotes('')
    },
  })

  const deleteConditionMutation = useMutation({
    mutationFn: deletePatientCondition,
    onSuccess: applyHistory,
  })

  const deleteAllergyMutation = useMutation({
    mutationFn: deletePatientAllergy,
    onSuccess: applyHistory,
  })

  const deleteMedicationMutation = useMutation({
    mutationFn: deletePatientMedication,
    onSuccess: applyHistory,
  })

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t('title')}</h2>
          <p className="muted">{t('subtitle')}</p>
        </div>
      </div>

      {query.isLoading && <p className="state">{t('loading')}</p>}
      {query.isError && <p className="state error">{t('loadError')}</p>}

      {query.data && (
        <div className="medical-history-grid">
          <HistoryColumn
            title={t('conditions')}
            emptyText={t('noConditions')}
            items={query.data.conditions.map((item) => ({
              id: item.id,
              title: item.name,
              details: item.notes ?? undefined,
            }))}
            canEdit={canEdit}
            onDelete={(id) => deleteConditionMutation.mutate(id)}
            deletePending={deleteConditionMutation.isPending}
          >
            {canEdit && (
              <div className="medical-history-form">
                <input
                  aria-label={t('conditionName')}
                  placeholder={t('conditionName')}
                  value={conditionName}
                  onChange={(event) => setConditionName(event.target.value)}
                />
                <input
                  aria-label={t('conditionNotes')}
                  placeholder={t('optionalNotes')}
                  value={conditionNotes}
                  onChange={(event) => setConditionNotes(event.target.value)}
                />
                <button
                  className="button secondary"
                  disabled={!conditionName.trim() || conditionMutation.isPending}
                  onClick={() => conditionMutation.mutate()}
                >
                  {conditionMutation.isPending ? t('adding') : t('addCondition')}
                </button>
                {conditionMutation.isError && (
                  <p className="field-error">{t('conditionError')}</p>
                )}
              </div>
            )}
          </HistoryColumn>

          <HistoryColumn
            title={t('allergies')}
            emptyText={t('noAllergies')}
            items={query.data.allergies.map((item) => ({
              id: item.id,
              title: item.name,
              details:
                [item.reaction, item.notes].filter(Boolean).join(' · ') || undefined,
            }))}
            canEdit={canEdit}
            onDelete={(id) => deleteAllergyMutation.mutate(id)}
            deletePending={deleteAllergyMutation.isPending}
          >
            {canEdit && (
              <div className="medical-history-form">
                <input
                  aria-label={t('allergyName')}
                  placeholder={t('allergyName')}
                  value={allergyName}
                  onChange={(event) => setAllergyName(event.target.value)}
                />
                <input
                  aria-label={t('allergyReaction')}
                  placeholder={t('optionalReaction')}
                  value={allergyReaction}
                  onChange={(event) => setAllergyReaction(event.target.value)}
                />
                <input
                  aria-label={t('allergyNotes')}
                  placeholder={t('optionalNotes')}
                  value={allergyNotes}
                  onChange={(event) => setAllergyNotes(event.target.value)}
                />
                <button
                  className="button secondary"
                  disabled={!allergyName.trim() || allergyMutation.isPending}
                  onClick={() => allergyMutation.mutate()}
                >
                  {allergyMutation.isPending ? t('adding') : t('addAllergy')}
                </button>
                {allergyMutation.isError && (
                  <p className="field-error">{t('allergyError')}</p>
                )}
              </div>
            )}
          </HistoryColumn>

          <HistoryColumn
            title={t('medications')}
            emptyText={t('noMedications')}
            items={query.data.medications.map((item) => ({
              id: item.id,
              title: item.name,
              details: [item.dosage, item.notes].filter(Boolean).join(' · ') || undefined,
            }))}
            canEdit={canEdit}
            onDelete={(id) => deleteMedicationMutation.mutate(id)}
            deletePending={deleteMedicationMutation.isPending}
          >
            {canEdit && (
              <div className="medical-history-form">
                <input
                  aria-label={t('medicationName')}
                  placeholder={t('medicationName')}
                  value={medicationName}
                  onChange={(event) => setMedicationName(event.target.value)}
                />
                <input
                  aria-label={t('medicationDosage')}
                  placeholder={t('optionalDosage')}
                  value={medicationDosage}
                  onChange={(event) => setMedicationDosage(event.target.value)}
                />
                <input
                  aria-label={t('medicationNotes')}
                  placeholder={t('optionalNotes')}
                  value={medicationNotes}
                  onChange={(event) => setMedicationNotes(event.target.value)}
                />
                <button
                  className="button secondary"
                  disabled={!medicationName.trim() || medicationMutation.isPending}
                  onClick={() => medicationMutation.mutate()}
                >
                  {medicationMutation.isPending ? t('adding') : t('addMedication')}
                </button>
                {medicationMutation.isError && (
                  <p className="field-error">{t('medicationError')}</p>
                )}
              </div>
            )}
          </HistoryColumn>
        </div>
      )}

      {(deleteConditionMutation.isError ||
        deleteAllergyMutation.isError ||
        deleteMedicationMutation.isError) && (
        <p className="field-error">{t('removeError')}</p>
      )}
    </section>
  )
}

function HistoryColumn({
  title,
  emptyText,
  items,
  canEdit,
  onDelete,
  deletePending,
  children,
}: {
  title: string
  emptyText: string
  items: { id: string; title: string; details?: string }[]
  canEdit: boolean
  onDelete: (id: string) => void
  deletePending: boolean
  children?: React.ReactNode
}) {
  const { t } = useTranslation('patientMedicalHistory')
  return (
    <section className="medical-history-column">
      <h3>{title}</h3>

      {children}

      <div className="medical-history-list">
        {items.length === 0 && <p className="muted">{emptyText}</p>}

        {items.map((item) => (
          <article className="medical-history-item" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              {item.details && <p className="muted">{item.details}</p>}
            </div>
            {canEdit && (
              <button
                className="button danger"
                disabled={deletePending}
                onClick={() => onDelete(item.id)}
              >
                {t('remove')}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
