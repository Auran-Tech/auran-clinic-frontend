import './patients.css'
import { Link, useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { useForm } from 'react-hook-form'
import { createPatient, findPatientDuplicates, getPatients } from './api'
import { patientSchema, type PatientFormValues } from './schema'
import type { CreatePatientInput, PatientDuplicateCandidate } from './types'
import { duplicateReviewKey } from './duplicateReview'

export function PatientsPage() {
  const { t } = useTranslation('patients')
  const queryClient = useQueryClient()
  const auth = useAuth()
  const [searchParams] = useSearchParams()
  const routeSearch = searchParams.get('search') ?? ''
  const [search, setSearch] = useState(routeSearch)
  const [page, setPage] = useState(1)
  const [duplicates, setDuplicates] = useState<PatientDuplicateCandidate[]>([])
  const [reviewedInput, setReviewedInput] = useState<CreatePatientInput | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    setSearch(routeSearch)
    setPage(1)
  }, [routeSearch])

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
      setReviewedInput(null)
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

    // Do not apply an old duplicate check to patient details edited mid-request.
    const requestKey = duplicateReviewKey(normalized)
    let matches: PatientDuplicateCandidate[]
    try {
      matches = await duplicateMutation.mutateAsync(normalized)
    } catch {
      // Fail closed: do not create a patient when duplicate validation is unavailable.
      return
    }
    const currentKey = duplicateReviewKey(form.getValues())
    if (currentKey !== requestKey) return

    if (matches.length > 0) {
      setReviewedInput(normalized)
      setDuplicates(matches)
      return
    }

    setReviewedInput(null)
    setDuplicates([])
    createMutation.mutate(normalized)
  })

  const totalPages = useMemo(
    () => patientsQuery.data?.setting.totalPage ?? 1,
    [patientsQuery.data],
  )
  const hasExactPhoneDuplicate = duplicates.some(
    (patient) => patient.matchReason === 'phone',
  )

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('management')}</p>
          <h1>{t('title')}</h1>
          <p className="muted">{t('subtitle')}</p>
        </div>
        <div className="actions">
          {auth.hasPermission('Patient_Create') && (
            <button
              className="button primary"
              onClick={() => setShowForm((value) => !value)}
            >
              {showForm ? t('close') : t('add')}
            </button>
          )}
          {auth.hasPermission('Reports_View') && (
            <Link className="button secondary nav-button" to="/dashboard">
              Dashboard
            </Link>
          )}
          {auth.hasPermission('Reports_View') && (
            <Link className="button secondary nav-button" to="/reports">
              Reports
            </Link>
          )}
          {auth.hasPermission('Settings_View') && (
            <Link className="button secondary nav-button" to="/settings">
              Settings
            </Link>
          )}
          {(auth.hasPermission('Users_View') || auth.hasPermission('RBAC_View')) && (
            <Link className="button secondary nav-button" to="/employees">
              Employees
            </Link>
          )}
          {auth.hasPermission('Queue_View') && (
            <Link className="button secondary nav-button" to="/queue">
              Live queue
            </Link>
          )}
        </div>
      </section>

      {showForm && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('register')}</h2>
              <p className="muted">{t('duplicateIntro')}</p>
            </div>
          </div>

          <form
            className="patient-form"
            onSubmit={onSubmit}
            onChange={() => {
              setDuplicates([])
              setReviewedInput(null)
            }}
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
              <input {...form.register('phone')} inputMode="tel" dir="ltr" />
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

            {duplicates.length > 0 && (
              <div className="duplicate-warning full-width" role="alert">
                <strong>{t('possibleDuplicate')}</strong>
                <p>{hasExactPhoneDuplicate ? t('samePhone') : t('reviewDuplicates')}</p>
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
                    onClick={() => {
                      setDuplicates([])
                      setReviewedInput(null)
                    }}
                  >
                    {t('editDetails')}
                  </button>
                  {!hasExactPhoneDuplicate && (
                    <button
                      type="button"
                      className="button danger"
                      onClick={() => {
                        if (
                          !reviewedInput ||
                          duplicateReviewKey(form.getValues()) !==
                            duplicateReviewKey(reviewedInput)
                        ) {
                          setDuplicates([])
                          setReviewedInput(null)
                          return
                        }
                        createMutation.mutate(reviewedInput)
                      }}
                    >
                      {t('createAnyway')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {duplicateMutation.isError && (
              <p className="field-error full-width" role="alert">
                {t('duplicateError')}
              </p>
            )}

            {createMutation.isError && (
              <p className="field-error full-width">{t('createError')}</p>
            )}

            <div className="actions full-width">
              <button
                className="button primary"
                type="submit"
                disabled={duplicateMutation.isPending || createMutation.isPending}
              >
                {duplicateMutation.isPending ? t('checking') : t('save')}
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
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
          />
        </div>

        {patientsQuery.isLoading && <p className="state">{t('loading')}</p>}
        {patientsQuery.isError && <p className="state error">{t('loadError')}</p>}
        {patientsQuery.data && patientsQuery.data.data.length === 0 && (
          <p className="state">{t('empty')}</p>
        )}

        {patientsQuery.data && patientsQuery.data.data.length > 0 && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('patientNumber')}</th>
                    <th>{t('name')}</th>
                    <th>{t('phone')}</th>
                    <th>{t('dateOfBirth')}</th>
                    <th>{t('gender')}</th>
                    <th>
                      <span className="sr-only">{t('open')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {patientsQuery.data.data.map((patient) => (
                    <tr key={patient.id}>
                      <td className="mono" dir="ltr">
                        {patient.patientNumber}
                      </td>
                      <td>
                        <Link className="patient-link" to={`/patients/${patient.id}`}>
                          <strong>{patient.fullName}</strong>
                        </Link>
                      </td>
                      <td className="mono" dir="ltr">
                        {patient.phone}
                      </td>
                      <td>{patient.dateOfBirth ?? '—'}</td>
                      <td>
                        {patient.gender === 'Female'
                          ? t('female')
                          : patient.gender === 'Male'
                            ? t('male')
                            : '—'}
                      </td>
                      <td>
                        <Link
                          className="button secondary patient-open-action"
                          to={`/patients/${patient.id}`}
                        >
                          {t('open')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="pagination">
              <span>
                {t('page', {
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
                  {t('previous')}
                </button>
                <button
                  className="button secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  {t('next')}
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </main>
  )
}
