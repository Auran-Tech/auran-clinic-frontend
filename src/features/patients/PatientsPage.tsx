import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useForm } from 'react-hook-form'
import {
  createPatient,
  findPatientDuplicates,
  getPatients,
} from './api'
import { patientSchema, type PatientFormValues } from './schema'
import type { PatientDuplicateCandidate } from './types'

export function PatientsPage() {
  const queryClient = useQueryClient()
  const auth = useAuth()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [duplicates, setDuplicates] = useState<PatientDuplicateCandidate[]>([])
  const [showForm, setShowForm] = useState(false)

  const patientsQuery = useQuery({
    queryKey: ['patients', search, page],
    queryFn: () => getPatients({ search: search || undefined, page, pageSize: 20 }),
  })

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      notes: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: async () => {
      form.reset()
      setDuplicates([])
      setShowForm(false)
      await queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: findPatientDuplicates,
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const normalized = {
      ...values,
      gender: values.gender || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      notes: values.notes || undefined,
    }

    const matches = await duplicateMutation.mutateAsync(normalized)
    if (matches.length > 0) {
      setDuplicates(matches)
      return
    }

    createMutation.mutate(normalized)
  })

  const totalPages = useMemo(
    () => patientsQuery.data?.setting.totalPage ?? 1,
    [patientsQuery.data],
  )
  const hasExactPhoneDuplicate = duplicates.some((patient) => patient.matchReason === 'phone')

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('patients.eyebrow')}</p>
          <h1>{t('patients.title')}</h1>
          <p className="muted">{t('patients.intro')}</p>
        </div>
        <div className="actions">
          <Link className="button secondary nav-button" to="/guide">{t('common.guide')}</Link>
          {auth.hasPermission('Patient_Create') && (
            <button className="button primary" onClick={() => setShowForm((value) => !value)}>
              {showForm ? t('patients.close') : t('patients.addPatient')}
            </button>
          )}
          {auth.hasPermission('Reports_View') && (
            <Link className="button secondary nav-button" to="/reports">
              {t('patients.reports')}
            </Link>
          )}
          {auth.hasPermission('Settings_View') && (
            <Link className="button secondary nav-button" to="/settings">
              {t('common.settings')}
            </Link>
          )}
          {(auth.hasPermission('Users_View') || auth.hasPermission('RBAC_View')) && (
            <Link className="button secondary nav-button" to="/employees">
              {t('common.employees')}
            </Link>
          )}
          {auth.hasPermission('Queue_View') && (
            <Link className="button secondary nav-button" to="/queue">
              {t('common.queue')}
            </Link>
          )}
          <button className="button secondary" onClick={() => void auth.signOut()}>
            {t('patients.signOut')}
          </button>
        </div>
      </section>

      {showForm && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('patients.register')}</h2>
              <p className="muted">{t('patients.duplicateIntro')}</p>
            </div>
          </div>

          <form className="patient-form" onSubmit={onSubmit}>
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

            {duplicates.length > 0 && (
              <div className="duplicate-warning full-width" role="alert">
                <strong>{t('patients.possibleDuplicate')}</strong>
                <p>
                  {hasExactPhoneDuplicate
                    ? t('patients.exactPhoneDuplicate')
                    : t('patients.duplicateReview')}
                </p>
                <ul>
                  {duplicates.map((patient) => (
                    <li key={patient.id}>
                      <span>{patient.fullName}</span>
                      <span>{patient.patientNumber}</span>
                      <span>{patient.phone}</span>
                    </li>
                  ))}
                </ul>
                <div className="actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setDuplicates([])}
                  >
                    {t('patients.editDetails')}
                  </button>
                  {!hasExactPhoneDuplicate && (
                    <button
                      type="button"
                      className="button danger"
                      onClick={() => createMutation.mutate({
                        ...form.getValues(),
                        gender: form.getValues('gender') || undefined,
                        dateOfBirth: form.getValues('dateOfBirth') || undefined,
                        notes: form.getValues('notes') || undefined,
                      })}
                    >
                      {t('patients.createAnyway')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {createMutation.isError && (
              <p className="field-error full-width">{t('patients.createError')}</p>
            )}

            <div className="actions full-width">
              <button
                className="button primary"
                type="submit"
                disabled={duplicateMutation.isPending || createMutation.isPending}
              >
                {duplicateMutation.isPending ? t('patients.checking') : t('patients.savePatient')}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="toolbar">
          <input
            className="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder={t('patients.searchPlaceholder')}
            aria-label={t('patients.searchAria')}
          />
        </div>

        {patientsQuery.isLoading && <p className="state">{t('patients.loading')}</p>}
        {patientsQuery.isError && (
          <p className="state error">{t('patients.loadError')}</p>
        )}
        {patientsQuery.data && patientsQuery.data.data.length === 0 && (
          <p className="state">{t('patients.empty')}</p>
        )}

        {patientsQuery.data && patientsQuery.data.data.length > 0 && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('patients.patientNo')}</th>
                    <th>{t('patients.name')}</th>
                    <th>{t('patients.phone')}</th>
                    <th>{t('patients.dob')}</th>
                    <th>{t('patients.gender')}</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsQuery.data.data.map((patient) => (
                    <tr key={patient.id}>
                      <td className="mono">{patient.patientNumber}</td>
                      <td>
                        <Link className="patient-link" to={`/patients/${patient.id}`}>
                          <strong>{patient.fullName}</strong>
                        </Link>
                      </td>
                      <td className="mono">{patient.phone}</td>
                      <td>{patient.dateOfBirth ?? '—'}</td>
                      <td>{patient.gender ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="pagination">
              <span>
                {t('patients.page', {
                  current: patientsQuery.data.setting.currentPage,
                  total: totalPages,
                })}
              </span>
              <div className="actions">
                <button
                  className="button secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  {t('patients.previous')}
                </button>
                <button
                  className="button secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  {t('patients.next')}
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </main>
  )
}
