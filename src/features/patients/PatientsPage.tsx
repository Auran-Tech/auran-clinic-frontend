import './PatientsPage.css'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, UserRound } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getPatients } from './api'
import { PatientRegistrationDialog } from './PatientRegistrationDialog'

export function PatientsPage() {
  const { t } = useTranslation('patients')
  const auth = useAuth()
  const [searchParams] = useSearchParams()
  const routeSearch = searchParams.get('search') ?? ''
  const [search, setSearch] = useState(routeSearch)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [showRegistration, setShowRegistration] = useState(false)

  useEffect(() => {
    setSearch(routeSearch)
    setPage(1)
  }, [routeSearch])

  const patientsQuery = useQuery({
    queryKey: ['patients', search, page, pageSize],
    queryFn: () =>
      getPatients({
        search: search || undefined,
        page,
        pageSize,
      }),
  })

  const result = patientsQuery.data
  const totalCount = result?.setting.totalCount ?? 0
  const totalPages = Math.max(1, result?.setting.totalPage ?? 1)
  const firstRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRow = Math.min(page * pageSize, totalCount)

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
          <label className="patients-search">
            <Search size={17} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchLabel')}
            />
          </label>
          <span className="patients-count">
            {t('totalPatients', { count: totalCount })}
          </span>
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
                  <th>{t('patientNumber')}</th>
                  <th>{t('name')}</th>
                  <th>{t('phone')}</th>
                  <th>{t('gender')}</th>
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
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setPage(1)
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
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

      {showRegistration && (
        <PatientRegistrationDialog onClose={() => setShowRegistration(false)} />
      )}
    </main>
  )
}
