import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getPatient, updatePatient } from './api'
import { getDoctors } from '../users/api'
import { getActiveVisit, startVisit } from '../visits/api'
import { ClinicalWorkspace } from '../clinicalSessions/ClinicalWorkspace'
import { PatientAttachmentsPanel } from '../attachments/PatientAttachmentsPanel'
import { DynamicPatientProfilePanel } from '../patientProfile/DynamicPatientProfilePanel'
import { PatientMedicalHistoryPanel } from '../patientMedicalHistory/PatientMedicalHistoryPanel'
import { PatientVisitHistoryPanel } from '../visits/PatientVisitHistoryPanel'
import { patientSchema, type PatientFormValues } from './schema'

export function PatientDetailsPage() {
  const { patientId } = useParams()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const [editing, setEditing] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')

  const patientQuery = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => getPatient(patientId!),
    enabled: Boolean(patientId),
  })

  const activeVisitQuery = useQuery({
    queryKey: ['active-visit', patientId],
    queryFn: () => getActiveVisit(patientId!),
    enabled: Boolean(patientId),
  })

  const doctorsQuery = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    enabled: auth.hasPermission('Visit_Start'),
  })

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  })

  useEffect(() => {
    if (!patientQuery.data) return
    form.reset({
      fullName: patientQuery.data.fullName,
      phone: patientQuery.data.phone,
      gender: patientQuery.data.gender ?? '',
      dateOfBirth: patientQuery.data.dateOfBirth ?? '',
      notes: patientQuery.data.notes ?? '',
    })
  }, [form, patientQuery.data])

  const startVisitMutation = useMutation({
    mutationFn: startVisit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['active-visit', patientId] })
      await queryClient.invalidateQueries({ queryKey: ['patient-visit-history', patientId] })
      setSelectedDoctorId('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: updatePatient,
    onSuccess: async (patient) => {
      queryClient.setQueryData(['patient', patient.id], patient)
      await queryClient.invalidateQueries({ queryKey: ['patients'] })
      setEditing(false)
    },
  })

  if (patientQuery.isLoading) {
    return <main className="page-shell"><p className="state">Loading patient…</p></main>
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <main className="page-shell">
        <Link className="back-link" to="/patients">← Patients</Link>
        <p className="state error">Unable to load patient.</p>
      </main>
    )
  }

  const patient = patientQuery.data
  const canEdit = auth.hasPermission('Patient_Edit_Basic')
  const canStartVisit = auth.hasPermission('Visit_Start')

  return (
    <main className="page-shell">
      <Link className="back-link" to="/patients">← Patients</Link>

      <section className="page-header patient-profile-header">
        <div>
          <p className="eyebrow mono">{patient.patientNumber}</p>
          <h1>{patient.fullName}</h1>
          <p className="muted">Patient profile</p>
        </div>
        {canEdit && (
          <button className="button secondary" onClick={() => setEditing((value) => !value)}>
            {editing ? 'Cancel edit' : 'Edit patient'}
          </button>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Clinic visit</h2>
            <p className="muted">Check the patient in and place them into the configured clinic workflow.</p>
          </div>
        </div>

        {activeVisitQuery.isLoading && <p className="state">Checking active visit…</p>}

        {activeVisitQuery.data ? (
          <div className="visit-status-card">
            <div>
              <span className="profile-label">Active visit</span>
              <strong>{activeVisitQuery.data.status}</strong>
            </div>
            <div>
              <span className="profile-label">Current stage</span>
              <strong>{activeVisitQuery.data.workflowStatusName}</strong>
            </div>
            <div>
              <span className="profile-label">Checked in</span>
              <strong>{new Date(activeVisitQuery.data.entryAtUtc).toLocaleString()}</strong>
            </div>
          </div>
        ) : canStartVisit ? (
          <div className="checkin-form">
            <label>
              <span>Doctor</span>
              <select
                value={selectedDoctorId}
                onChange={(event) => setSelectedDoctorId(event.target.value)}
              >
                <option value="">Select doctor</option>
                {(doctorsQuery.data ?? []).map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
                ))}
              </select>
            </label>

            {doctorsQuery.isError && (
              <p className="field-error">Unable to load doctors.</p>
            )}

            {startVisitMutation.isError && (
              <p className="field-error">
                Unable to check in this patient. They may already have an active visit or clinic workflow is not configured.
              </p>
            )}

            <div className="actions">
              <button
                className="button primary"
                disabled={!selectedDoctorId || startVisitMutation.isPending}
                onClick={() => startVisitMutation.mutate({
                  patientId: patient.id,
                  doctorId: selectedDoctorId,
                })}
              >
                {startVisitMutation.isPending ? 'Checking in…' : 'Check in patient'}
              </button>
            </div>
          </div>
        ) : (
          <p className="muted">You do not have permission to start clinic visits.</p>
        )}
      </section>

      {activeVisitQuery.data && (
        <ClinicalWorkspace visitId={activeVisitQuery.data.id} />
      )}

      <DynamicPatientProfilePanel patientId={patient.id} />

      <PatientMedicalHistoryPanel patientId={patient.id} />

      <PatientVisitHistoryPanel patientId={patient.id} />

      <PatientAttachmentsPanel patientId={patient.id} />

      {editing ? (
        <section className="panel">
          <form
            className="patient-form"
            onSubmit={form.handleSubmit((values) => updateMutation.mutate({
              patientId: patient.id,
              ...values,
              gender: values.gender || undefined,
              dateOfBirth: values.dateOfBirth || undefined,
              notes: values.notes || undefined,
            }))}
          >
            <label>
              <span>Full name</span>
              <input {...form.register('fullName')} />
              {form.formState.errors.fullName && (
                <small className="field-error">{form.formState.errors.fullName.message}</small>
              )}
            </label>

            <label>
              <span>Phone</span>
              <input {...form.register('phone')} inputMode="tel" />
              {form.formState.errors.phone && (
                <small className="field-error">{form.formState.errors.phone.message}</small>
              )}
            </label>

            <label>
              <span>Gender</span>
              <select {...form.register('gender')}>
                <option value="">Not specified</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </label>

            <label>
              <span>Date of birth</span>
              <input type="date" {...form.register('dateOfBirth')} />
            </label>

            <label className="full-width">
              <span>Notes</span>
              <textarea rows={4} {...form.register('notes')} />
            </label>

            {updateMutation.isError && (
              <p className="field-error full-width">
                Unable to update patient. The phone number may already belong to another patient.
              </p>
            )}

            <div className="actions full-width">
              <button className="button primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel">
          <div className="profile-grid">
            <div>
              <span className="profile-label">Phone</span>
              <strong className="mono">{patient.phone}</strong>
            </div>
            <div>
              <span className="profile-label">Date of birth</span>
              <strong>{patient.dateOfBirth ?? 'Not provided'}</strong>
            </div>
            <div>
              <span className="profile-label">Gender</span>
              <strong>{patient.gender ?? 'Not provided'}</strong>
            </div>
            <div>
              <span className="profile-label">Registered</span>
              <strong>{new Date(patient.createdDate).toLocaleDateString()}</strong>
            </div>
          </div>

          <div className="profile-notes">
            <span className="profile-label">Notes</span>
            <p>{patient.notes || 'No notes recorded.'}</p>
          </div>
        </section>
      )}
    </main>
  )
}
