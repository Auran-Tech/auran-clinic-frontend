import './PatientsPage.css'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Pencil,
  Plus,
  UserRound,
} from 'lucide-react'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../auth/AuthContext'
import { getPatients } from './api'
import { PatientRegistrationDialog } from './PatientRegistrationDialog'
import type { PatientQuery } from './types'
import {
  PATIENT_GENDER,
  PATIENT_SORT_CHOICE,
  PATIENT_SORT_QUERY,
  type PatientSortChoice,
} from './listOptions'

interface PatientFilters {
  search: string
  gender: '' | NonNullable<PatientQuery['gender']>
  sort: PatientSortChoice
}

export function PatientsPage() {
  const { t } = useTranslation('patients')
  const auth = useAuth()
  const [searchParams] = useSearchParams()
  const routeSearch = searchParams.get('search') ?? ''
  const [filters, setFilters] = useState<PatientFilters>({
    search: routeSearch,
    gender: '',
    sort: PATIENT_SORT_CHOICE.nameAsc,
  })
  const [draft, setDraft] = useState<PatientFilters>(filters)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [showRegistration, setShowRegistration] = useState(false)

  useEffect(() => {
    setFilters((current) => ({ ...current, search: routeSearch }))
    setDraft((current) => ({ ...current, search: routeSearch }))
    setPage(1)
  }, [routeSearch])

  const patientsQuery = useQuery({
    queryKey: ['patients', filters, page, pageSize],
    queryFn: () =>
      getPatients({
        search: filters.search.trim() || undefined,
        gender: filters.gender || undefined,
        ...PATIENT_SORT_QUERY[filters.sort],
        page,
        pageSize,
      }),
  })

  const result = patientsQuery.data
  const totalCount = result?.setting.totalCount ?? 0
  const totalPages = Math.max(1, result?.setting.totalPage ?? 1)
  const firstRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRow = Math.min(page * pageSize, totalCount)
  const genderOptions = [
    { label: t('allGenders'), value: '' },
    { label: t('female'), value: PATIENT_GENDER.female },
    { label: t('male'), value: PATIENT_GENDER.male },
    { label: t('notSpecified'), value: PATIENT_GENDER.unspecified },
  ]
  const activeFilterCount =
    Number(Boolean(filters.search.trim())) + Number(Boolean(filters.gender))

  function sortByHeader(ascending: PatientSortChoice, descending: PatientSortChoice) {
    setFilters((current) => ({
      ...current,
      sort: current.sort === ascending ? descending : ascending,
    }))
    setPage(1)
  }

  function sortIcon(ascending: PatientSortChoice, descending: PatientSortChoice) {
    if (filters.sort === ascending) return <ArrowUp size={13} aria-hidden="true" />
    if (filters.sort === descending) return <ArrowDown size={13} aria-hidden="true" />
    return <ArrowUpDown size={13} aria-hidden="true" />
  }

  return (
    <main className="page-shell patients-page">
      <header className="patients-header">
        <div className="patients-breadcrumb">
          <span>{t('clinic')}</span>
          <span aria-hidden="true">·</span>
          <strong>{t('title')}</strong>
        </div>

        <div className="patients-heading-row">
          <div>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          {auth.hasPermission('Patient_Create') && (
            <button
              className="button primary patients-register-button"
              type="button"
              onClick={() => setShowRegistration(true)}
            >
              <Plus size={15} aria-hidden="true" />
              {t('register')}
            </button>
          )}
        </div>
      </header>

      <section className="patients-card" aria-label={t('title')}>
        <div className="patients-toolbar">
          <span className="patients-count">
            {t('totalPatients', { count: totalCount })}
          </span>
          <div className="patients-filter-actions">
            <button
              type="button"
              className="button secondary"
              disabled={activeFilterCount === 0}
              onClick={() => {
                setFilters((current) => ({ ...current, search: '', gender: '' }))
                setPage(1)
              }}
            >
              {t('clearFilters')}
            </button>
            <button
              type="button"
              className="button secondary patients-filter-button"
              onClick={() => {
                setDraft(filters)
                setShowFilters(true)
              }}
            >
              <ListFilter size={16} aria-hidden="true" />
              {t('filters')}
              {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
            </button>
          </div>
        </div>

        {patientsQuery.isLoading && <p className="patients-state">{t('loading')}</p>}
        {patientsQuery.isError && (
          <div className="patients-state" role="alert">
            <p>{t('loadError')}</p>
            <button
              className="button secondary"
              type="button"
              onClick={() => patientsQuery.refetch()}
            >
              {t('retry')}
            </button>
          </div>
        )}
        {result && result.data.length === 0 && (
          <p className="patients-state">{t('empty')}</p>
        )}

        {result && result.data.length > 0 && (
          <div className="patients-table-wrap">
            <table className="patients-table">
              <thead>
                <tr>
                  <th
                    aria-sort={
                      filters.sort === PATIENT_SORT_CHOICE.numberAsc
                        ? 'ascending'
                        : filters.sort === PATIENT_SORT_CHOICE.numberDesc
                          ? 'descending'
                          : 'none'
                    }
                  >
                    <button
                      type="button"
                      className="patients-sort-button"
                      onClick={() =>
                        sortByHeader(
                          PATIENT_SORT_CHOICE.numberAsc,
                          PATIENT_SORT_CHOICE.numberDesc,
                        )
                      }
                    >
                      {t('patientNumber')}
                      {sortIcon(
                        PATIENT_SORT_CHOICE.numberAsc,
                        PATIENT_SORT_CHOICE.numberDesc,
                      )}
                    </button>
                  </th>
                  <th
                    aria-sort={
                      filters.sort === PATIENT_SORT_CHOICE.nameAsc
                        ? 'ascending'
                        : filters.sort === PATIENT_SORT_CHOICE.nameDesc
                          ? 'descending'
                          : 'none'
                    }
                  >
                    <button
                      type="button"
                      className="patients-sort-button"
                      onClick={() =>
                        sortByHeader(
                          PATIENT_SORT_CHOICE.nameAsc,
                          PATIENT_SORT_CHOICE.nameDesc,
                        )
                      }
                    >
                      {t('name')}
                      {sortIcon(
                        PATIENT_SORT_CHOICE.nameAsc,
                        PATIENT_SORT_CHOICE.nameDesc,
                      )}
                    </button>
                  </th>
                  <th
                    aria-sort={
                      filters.sort === PATIENT_SORT_CHOICE.phoneAsc
                        ? 'ascending'
                        : filters.sort === PATIENT_SORT_CHOICE.phoneDesc
                          ? 'descending'
                          : 'none'
                    }
                  >
                    <button
                      type="button"
                      className="patients-sort-button"
                      onClick={() =>
                        sortByHeader(
                          PATIENT_SORT_CHOICE.phoneAsc,
                          PATIENT_SORT_CHOICE.phoneDesc,
                        )
                      }
                    >
                      {t('phone')}
                      {sortIcon(
                        PATIENT_SORT_CHOICE.phoneAsc,
                        PATIENT_SORT_CHOICE.phoneDesc,
                      )}
                    </button>
                  </th>
                  <th
                    aria-sort={
                      filters.sort === PATIENT_SORT_CHOICE.genderAsc
                        ? 'ascending'
                        : filters.sort === PATIENT_SORT_CHOICE.genderDesc
                          ? 'descending'
                          : 'none'
                    }
                  >
                    <button
                      type="button"
                      className="patients-sort-button"
                      onClick={() =>
                        sortByHeader(
                          PATIENT_SORT_CHOICE.genderAsc,
                          PATIENT_SORT_CHOICE.genderDesc,
                        )
                      }
                    >
                      {t('gender')}
                      {sortIcon(
                        PATIENT_SORT_CHOICE.genderAsc,
                        PATIENT_SORT_CHOICE.genderDesc,
                      )}
                    </button>
                  </th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((patient) => (
                  <tr key={patient.id}>
                    <td className="patients-number" dir="ltr">
                      {patient.patientNumber}
                    </td>
                    <td>
                      <Link className="patients-name" to={`/patients/${patient.id}`}>
                        {patient.fullName}
                      </Link>
                    </td>
                    <td className="patients-phone" dir="ltr">
                      {patient.phone}
                    </td>
                    <td>
                      <span className="patients-gender">
                        {patient.gender === 'Female'
                          ? t('female')
                          : patient.gender === 'Male'
                            ? t('male')
                            : t('notSpecified')}
                      </span>
                    </td>
                    <td>
                      <div className="patients-row-actions">
                        <Link to={`/patients/${patient.id}`}>
                          <UserRound size={13} aria-hidden="true" />
                          {t('open')}
                        </Link>
                        {auth.hasPermission('Patient_Edit_Basic') && (
                          <Link to={`/patients/${patient.id}?edit=1`}>
                            <Pencil size={13} aria-hidden="true" />
                            {t('edit')}
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result && (
          <footer className="patients-pagination">
            <label>
              {t('rowsPerPage')}
              <Dropdown
                className="auran-prime-field patients-page-size"
                value={pageSize}
                options={[5, 10, 20, 50].map((size) => ({
                  label: String(size),
                  value: size,
                }))}
                optionLabel="label"
                optionValue="value"
                filter
                panelClassName="auran-prime-panel"
                aria-label={t('rowsPerPage')}
                onChange={(event) => {
                  setPageSize(Number(event.value))
                  setPage(1)
                }}
              />
            </label>
            <span>
              {t('showing', { first: firstRow, last: lastRow, total: totalCount })}
            </span>
            <div className="patients-page-buttons">
              <button
                type="button"
                aria-label={t('previous')}
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
              <span>{t('page', { current: page, total: totalPages })}</span>
              <button
                type="button"
                aria-label={t('next')}
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
            </div>
          </footer>
        )}
      </section>

      <Dialog
        header={t('filters')}
        visible={showFilters}
        modal
        draggable={false}
        resizable={false}
        className="auran-filter-dialog"
        onHide={() => setShowFilters(false)}
        footer={
          <div className="auran-filter-footer">
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                setDraft({
                  search: '',
                  gender: '',
                  sort: filters.sort,
                })
              }
            >
              {t('clearFilters')}
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => {
                setFilters(draft)
                setPage(1)
                setShowFilters(false)
              }}
            >
              {t('applyFilters')}
            </button>
          </div>
        }
      >
        <div className="auran-filter-fields">
          <label htmlFor="patient-filter-search">
            {t('searchLabel')}
            <InputText
              id="patient-filter-search"
              className="auran-prime-field"
              value={draft.search}
              placeholder={t('searchPlaceholder')}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
            />
          </label>
          <label htmlFor="patient-filter-gender">
            {t('gender')}
            <Dropdown
              inputId="patient-filter-gender"
              className="auran-prime-field"
              panelClassName="auran-prime-panel"
              value={draft.gender}
              options={genderOptions}
              optionLabel="label"
              optionValue="value"
              filter
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  gender: event.value as PatientFilters['gender'],
                }))
              }
            />
          </label>
        </div>
      </Dialog>

      {showRegistration && (
        <PatientRegistrationDialog onClose={() => setShowRegistration(false)} />
      )}
    </main>
  )
}
