import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
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

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Patient management</p>
          <h1>Patients</h1>
          <p className="muted">
            Search, review, and register clinic patients.
          </p>
        </div>
        <button className="button primary" onClick={() => setShowForm((value) => !value)}>
          {showForm ? 'Close' : 'Add patient'}
        </button>
      </section>

      {showForm && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Register patient</h2>
              <p className="muted">Duplicate candidates are checked before creation.</p>
            </div>
          </div>

          <form className="patient-form" onSubmit={onSubmit}>
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

            {duplicates.length > 0 && (
              <div className="duplicate-warning full-width" role="alert">
                <strong>Possible duplicate patient</strong>
                <p>Review these records before creating a new patient.</p>
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
                    Edit details
                  </button>
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
                    Create anyway
                  </button>
                </div>
              </div>
            )}

            {createMutation.isError && (
              <p className="field-error full-width">
                Unable to create patient. Please review the details and try again.
              </p>
            )}

            <div className="actions full-width">
              <button
                className="button primary"
                type="submit"
                disabled={duplicateMutation.isPending || createMutation.isPending}
              >
                {duplicateMutation.isPending ? 'Checking…' : 'Save patient'}
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
            placeholder="Search by name, phone, or patient number"
            aria-label="Search patients"
          />
        </div>

        {patientsQuery.isLoading && <p className="state">Loading patients…</p>}
        {patientsQuery.isError && (
          <p className="state error">Unable to load patients.</p>
        )}
        {patientsQuery.data && patientsQuery.data.data.length === 0 && (
          <p className="state">No patients found.</p>
        )}

        {patientsQuery.data && patientsQuery.data.data.length > 0 && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient no.</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Date of birth</th>
                    <th>Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsQuery.data.data.map((patient) => (
                    <tr key={patient.id}>
                      <td className="mono">{patient.patientNumber}</td>
                      <td><strong>{patient.fullName}</strong></td>
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
                Page {patientsQuery.data.setting.currentPage} of {totalPages}
              </span>
              <div className="actions">
                <button
                  className="button secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </button>
                <button
                  className="button secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </main>
  )
}
