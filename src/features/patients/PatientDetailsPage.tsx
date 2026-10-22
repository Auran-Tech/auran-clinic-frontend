import './patients.css'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation('patients')
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
      await queryClient.invalidateQueries({
        queryKey: ['patient-visit-history', patientId],
      })
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
    return (
      <main className="page-shell">
        <p className="state">{t('loadingPatient')}</p>
      </main>
    )
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <main className="page-shell">
        <Link className="back-link" to="/patients">
          {t('backToPatients')}
        </Link>
        <p className="state error">{t('patientLoadError')}</p>
      </main>
    )
  }

  const patient = patientQuery.data
  const canEdit = auth.hasPermission('Patient_Edit_Basic')
  const canStartVisit = auth.hasPermission('Visit_Start')

  return (
    <main className="page-shell">
      <Link className="back-link" to="/patients">
        {t('backToPatients')}
      </Link>

      <section className="page-header patient-profile-header">
        <div>
          <p className="eyebrow mono">{patient.patientNumber}</p>
          <h1>{patient.fullName}</h1>
          <p className="muted">{t('profile')}</p>
        </div>
        {canEdit && (
          <button
            className="button secondary"
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? t('cancelEdit') : t('editPatient')}
          </button>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t('clinicVisit')}</h2>
            <p className="muted">{t('visitSubtitle')}</p>
          </div>
        </div>

        {activeVisitQuery.isLoading && <p className="state">{t('checkingVisit')}</p>}

        {activeVisitQuery.data ? (
          <div className="visit-status-card">
            <div>
              <span className="profile-label">{t('activeVisit')}</span>
              <strong>
                {t(activeVisitQuery.data.status, {
                  defaultValue: activeVisitQuery.data.status,
                })}
              </strong>
            </div>
            <div>
              <span className="profile-label">{t('currentStage')}</span>
              <strong>{activeVisitQuery.data.workflowStatusName}</strong>
            </div>
            <div>
              <span className="profile-label">{t('checkedIn')}</span>
              <strong>
                {new Date(activeVisitQuery.data.entryAtUtc).toLocaleString(i18n.language)}
              </strong>
            </div>
          </div>
        ) : canStartVisit ? (
          <div className="checkin-form">
            <label>
              <span>{t('doctor')}</span>
              <select
                value={selectedDoctorId}
                onChange={(event) => setSelectedDoctorId(event.target.value)}
              >
                <option value="">{t('selectDoctor')}</option>
                {(doctorsQuery.data ?? []).map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName}
                  </option>
                ))}
              </select>
            </label>

            {doctorsQuery.isError && <p className="field-error">{t('doctorsError')}</p>}

            {startVisitMutation.isError && (
              <p className="field-error">{t('checkInError')}</p>
            )}

            <div className="actions">
              <button
                className="button primary"
                disabled={!selectedDoctorId || startVisitMutation.isPending}
                onClick={() =>
                  startVisitMutation.mutate({
                    patientId: patient.id,
                    doctorId: selectedDoctorId,
                  })
                }
              >
                {startVisitMutation.isPending ? t('checkingIn') : t('checkIn')}
              </button>
            </div>
          </div>
        ) : (
          <p className="muted">{t('startVisitForbidden')}</p>
        )}
      </section>

      {activeVisitQuery.data && <ClinicalWorkspace visitId={activeVisitQuery.data.id} />}

      <DynamicPatientProfilePanel patientId={patient.id} />

      <PatientMedicalHistoryPanel patientId={patient.id} />
      <PatientVisitHistoryPanel patientId={patient.id} />

      <PatientAttachmentsPanel patientId={patient.id} />

      {editing ? (
        <section className="panel">
          <form
            className="patient-form"
            onSubmit={form.handleSubmit((values) =>
              updateMutation.mutate({
                patientId: patient.id,
                ...values,
                gender: values.gender || undefined,
                dateOfBirth: values.dateOfBirth || undefined,
                notes: values.notes || undefined,
              }),
            )}
          >
            <label>
              <span>{t('fullName')}</span>
              <input {...form.register('fullName')} />
              {form.formState.errors.fullName && (
                <small className="field-error">
                  {form.formState.errors.fullName.message}
                </small>
              )}
            </label>

            <label>
              <span>{t('phone')}</span>
              <input {...form.register('phone')} inputMode="tel" />
              {form.formState.errors.phone && (
                <small className="field-error">
                  {form.formState.errors.phone.message}
                </small>
              )}
            </label>

            <label>
              <span>{t('gender')}</span>
              <select {...form.register('gender')}>
                <option value="">{t('notSpecified')}</option>
                <option value="Female">{t('female')}</option>
                <option value="Male">{t('male')}</option>
              </select>
            </label>

            <label>
              <span>{t('dateOfBirth')}</span>
              <input type="date" {...form.register('dateOfBirth')} />
            </label>

            <label className="full-width">
              <span>{t('notes')}</span>
              <textarea rows={4} {...form.register('notes')} />
            </label>

            {updateMutation.isError && (
              <p className="field-error full-width">{t('updateError')}</p>
            )}

            <div className="actions full-width">
              <button
                className="button primary"
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? t('saving') : t('saveChanges')}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel">
          <div className="profile-grid">
            <div>
              <span className="profile-label">{t('phone')}</span>
              <strong className="mono">{patient.phone}</strong>
            </div>
            <div>
              <span className="profile-label">{t('dateOfBirth')}</span>
              <strong>{patient.dateOfBirth ?? t('notProvided')}</strong>
            </div>
            <div>
              <span className="profile-label">{t('gender')}</span>
              <strong>
                {patient.gender === 'Female'
                  ? t('female')
                  : patient.gender === 'Male'
                    ? t('male')
                    : t('notProvided')}
              </strong>
            </div>
            <div>
              <span className="profile-label">{t('registered')}</span>
              <strong>
                {new Date(patient.createdDate).toLocaleDateString(i18n.language)}
              </strong>
            </div>
          </div>

          <div className="profile-notes">
            <span className="profile-label">{t('notes')}</span>
            <p>{patient.notes || t('noNotes')}</p>
          </div>
        </section>
      )}
    </main>
  )
}
