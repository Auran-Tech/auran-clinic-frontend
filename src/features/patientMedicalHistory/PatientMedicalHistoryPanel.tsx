import { useState } from 'react'
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
          <h2>Medical history</h2>
          <p className="muted">
            Current patient conditions, allergies, and medications.
          </p>
        </div>
      </div>

      {query.isLoading && <p className="state">Loading medical history…</p>}
      {query.isError && <p className="state error">Unable to load medical history.</p>}

      {query.data && (
        <div className="medical-history-grid">
          <HistoryColumn
            title="Conditions"
            emptyText="No conditions recorded."
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
                  aria-label="Condition name"
                  placeholder="Condition name"
                  value={conditionName}
                  onChange={(event) => setConditionName(event.target.value)}
                />
                <input
                  aria-label="Condition notes"
                  placeholder="Notes (optional)"
                  value={conditionNotes}
                  onChange={(event) => setConditionNotes(event.target.value)}
                />
                <button
                  className="button secondary"
                  disabled={!conditionName.trim() || conditionMutation.isPending}
                  onClick={() => conditionMutation.mutate()}
                >
                  {conditionMutation.isPending ? 'Adding…' : 'Add condition'}
                </button>
                {conditionMutation.isError && (
                  <p className="field-error">
                    Unable to add condition. It may already be recorded.
                  </p>
                )}
              </div>
            )}
          </HistoryColumn>

          <HistoryColumn
            title="Allergies"
            emptyText="No allergies recorded."
            items={query.data.allergies.map((item) => ({
              id: item.id,
              title: item.name,
              details: [item.reaction, item.notes].filter(Boolean).join(' · ') || undefined,
            }))}
            canEdit={canEdit}
            onDelete={(id) => deleteAllergyMutation.mutate(id)}
            deletePending={deleteAllergyMutation.isPending}
          >
            {canEdit && (
              <div className="medical-history-form">
                <input
                  aria-label="Allergy name"
                  placeholder="Allergy name"
                  value={allergyName}
                  onChange={(event) => setAllergyName(event.target.value)}
                />
                <input
                  aria-label="Allergy reaction"
                  placeholder="Reaction (optional)"
                  value={allergyReaction}
                  onChange={(event) => setAllergyReaction(event.target.value)}
                />
                <input
                  aria-label="Allergy notes"
                  placeholder="Notes (optional)"
                  value={allergyNotes}
                  onChange={(event) => setAllergyNotes(event.target.value)}
                />
                <button
                  className="button secondary"
                  disabled={!allergyName.trim() || allergyMutation.isPending}
                  onClick={() => allergyMutation.mutate()}
                >
                  {allergyMutation.isPending ? 'Adding…' : 'Add allergy'}
                </button>
                {allergyMutation.isError && (
                  <p className="field-error">
                    Unable to add allergy. It may already be recorded.
                  </p>
                )}
              </div>
            )}
          </HistoryColumn>

          <HistoryColumn
            title="Medications"
            emptyText="No medications recorded."
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
                  aria-label="Medication name"
                  placeholder="Medication name"
                  value={medicationName}
                  onChange={(event) => setMedicationName(event.target.value)}
                />
                <input
                  aria-label="Medication dosage"
                  placeholder="Dosage (optional)"
                  value={medicationDosage}
                  onChange={(event) => setMedicationDosage(event.target.value)}
                />
                <input
                  aria-label="Medication notes"
                  placeholder="Notes (optional)"
                  value={medicationNotes}
                  onChange={(event) => setMedicationNotes(event.target.value)}
                />
                <button
                  className="button secondary"
                  disabled={!medicationName.trim() || medicationMutation.isPending}
                  onClick={() => medicationMutation.mutate()}
                >
                  {medicationMutation.isPending ? 'Adding…' : 'Add medication'}
                </button>
                {medicationMutation.isError && (
                  <p className="field-error">
                    Unable to add medication. It may already be recorded.
                  </p>
                )}
              </div>
            )}
          </HistoryColumn>
        </div>
      )}

      {(deleteConditionMutation.isError ||
        deleteAllergyMutation.isError ||
        deleteMedicationMutation.isError) && (
        <p className="field-error">Unable to remove this medical-history item.</p>
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
                Remove
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
