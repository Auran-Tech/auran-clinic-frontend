import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
    return <main className="page-shell"><p className="state">{t('patientDetails.loading')}</p></main>
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <main className="page-shell">
        <Link className="back-link" to="/patients">← {t('patientDetails.back')}</Link>
        <p className="state error">{t('patientDetails.loadError')}</p>
      </main>
    )
  }

  const patient = patientQuery.data
  const canEdit = auth.hasPermission('Patient_Edit_Basic')
  const canStartVisit = auth.hasPermission('Visit_Start')

  return (
    <main className="page-shell">
      <Link className="back-link" to="/patients">← {t('patientDetails.back')}</Link>

      <section className="page-header patient-profile-header">
        <div>
          <p className="eyebrow mono">{patient.patientNumber}</p>
          <h1>{patient.fullName}</h1>
          <p className="muted">{t('patientDetails.profile')}</p>
        </div>
        {canEdit && (
          <button className="button secondary" onClick={() => setEditing((value) => !value)}>
            {editing ? t('patientDetails.cancelEdit') : t('patientDetails.editPatient')}
          </button>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t('patientDetails.clinicVisit')}</h2>
            <p className="muted">{t('patientDetails.clinicVisitIntro')}</p>
          </div>
        </div>

        {activeVisitQuery.isLoading && <p className="state">{t('patientDetails.checkingActive')}</p>}

        {activeVisitQuery.data ? (
          <div className="visit-status-card">
            <div>
              <span className="profile-label">{t('patientDetails.activeVisit')}</span>
              <strong>{activeVisitQuery.data.status}</strong>
            </div>
            <div>
              <span className="profile-label">{t('patientDetails.currentStage')}</span>
              <strong>{activeVisitQuery.data.workflowStatusName}</strong>
            </div>
            <div>
              <span className="profile-label">{t('patientDetails.checkedIn')}</span>
              <strong>{new Date(activeVisitQuery.data.entryAtUtc).toLocaleString()}</strong>
            </div>
          </div>
        ) : canStartVisit ? (
          <div className="checkin-form">
            <label>
              <span>{t('common.doctor')}</span>
              <select
                value={selectedDoctorId}
                onChange={(event) => setSelectedDoctorId(event.target.value)}
              >
                <option value="">{t('patientDetails.selectDoctor')}</option>
                {(doctorsQuery.data ?? []).map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
                ))}
              </select>
            </label>

            {doctorsQuery.isError && (
              <p className="field-error">{t('patientDetails.doctorsError')}</p>
            )}

            {startVisitMutation.isError && (
              <p className="field-error">{t('patientDetails.checkInError')}</p>
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
                {startVisitMutation.isPending
                  ? t('patientDetails.checkingIn')
                  : t('patientDetails.checkIn')}
              </button>
            </div>
          </div>
        ) : (
          <p className="muted">{t('patientDetails.noStartPermission')}</p>
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
              <span>{t('patients.fullName')}</span>
              <input {...form.register('fullName')} />
              {form.formState.errors.fullName && (
                <small className="field-error">{form.formState.errors.fullName.message}</small>
              )}
            </label>

            <label>
              <span>{t('patients.phone')}</span>
              <input {...form.register('phone')} inputMode="tel" />
              {form.formState.errors.phone && (
                <small className="field-error">{form.formState.errors.phone.message}</small>
              )}
            </label>

            <label>
              <span>{t('patients.gender')}</span>
              <select {...form.register('gender')}>
                <option value="">{t('patients.notSpecified')}</option>
                <option value="Female">{t('patients.female')}</option>
                <option value="Male">{t('patients.male')}</option>
              </select>
            </label>

            <label>
              <span>{t('patients.dob')}</span>
              <input type="date" {...form.register('dateOfBirth')} />
            </label>

            <label className="full-width">
              <span>{t('patients.notes')}</span>
              <textarea rows={4} {...form.register('notes')} />
            </label>

            {updateMutation.isError && (
              <p className="field-error full-width">{t('patientDetails.updateError')}</p>
            )}

            <div className="actions full-width">
              <button className="button primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending
                  ? t('patientDetails.saving')
                  : t('patientDetails.saveChanges')}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel">
          <div className="profile-grid">
            <div>
              <span className="profile-label">{t('patients.phone')}</span>
              <strong className="mono">{patient.phone}</strong>
            </div>
            <div>
              <span className="profile-label">{t('patients.dob')}</span>
              <strong>{patient.dateOfBirth ?? t('patientDetails.notProvided')}</strong>
            </div>
            <div>
              <span className="profile-label">{t('patients.gender')}</span>
              <strong>{patient.gender ?? t('patientDetails.notProvided')}</strong>
            </div>
            <div>
              <span className="profile-label">{t('patientDetails.registered')}</span>
              <strong>{new Date(patient.createdDate).toLocaleDateString()}</strong>
            </div>
          </div>

          <div className="profile-notes">
            <span className="profile-label">{t('patients.notes')}</span>
            <p>{patient.notes || t('patientDetails.noNotes')}</p>
          </div>
        </section>
      )}
    </main>
  )
}
