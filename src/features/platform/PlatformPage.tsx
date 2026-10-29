import './platform.css'
import '../auth/auth.css'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, CircleCheck, CirclePause } from 'lucide-react'
import { KpiCard } from '../../components/ui/KpiCard'
import { useAuth } from '../auth/AuthContext'
import {
  connectionRestoredEvent,
  isTransientConnectionFailure,
} from '../../lib/connectionSignals'
import {
  getPlatformClinicDetails,
  getPlatformLookups,
  listPlatformClinics,
  platformLogin,
  platformLogout,
  platformRefresh,
  provisionPlatformClinic,
  setPlatformClinicStatus,
  updatePlatformClinic,
  type PlatformClinic,
  type PlatformClinicDetails,
  type PlatformLocale,
  type PlatformTimeZone,
  type PlatformSession,
  type ProvisionClinicInput,
  type UpdatePlatformClinicInput,
} from './api'

export function PlatformPage() {
  const { t } = useTranslation('platform')
  const clinicAuth = useAuth()
  // Deliberately memory-only. A page reload requires re-authentication as Platform.
  const [session, setSession] = useState<PlatformSession | null>(null)
  const sessionRef = useRef<PlatformSession | null>(null)
  const refreshInFlight = useRef<Promise<PlatformSession> | null>(null)
  const actorGeneration = useRef(0)

  // Never resurrect a logged-out identity after an asynchronous refresh.
  async function activeSession(): Promise<PlatformSession> {
    const active = sessionRef.current
    if (!active) throw new Error('Platform session unavailable.')
    const expiresAt = Date.parse(active.accessTokenExpiresDate)
    if (Number.isFinite(expiresAt) && expiresAt > Date.now() + 60_000) return active
    if (!refreshInFlight.current) {
      const generation = actorGeneration.current
      const refreshToken = active.refreshToken
      const pending = platformRefresh(refreshToken)
        .then((next) => {
          if (
            actorGeneration.current !== generation ||
            sessionRef.current?.refreshToken !== refreshToken
          )
            throw new Error('Platform session changed during refresh.')
          sessionRef.current = next
          setSession(next)
          return next
        })
        .catch((error) => {
          if (
            !isTransientConnectionFailure(error) &&
            actorGeneration.current === generation &&
            sessionRef.current?.refreshToken === refreshToken
          ) {
            actorGeneration.current += 1
            sessionRef.current = null
            setSession(null)
            setClinics([])
            setSelectedClinic(null)
            setEdit(null)
            setError(t('sessionExpired'))
          }
          throw error
        })
        .finally(() => {
          if (refreshInFlight.current === pending) refreshInFlight.current = null
        })
      refreshInFlight.current = pending
    }
    return refreshInFlight.current
  }
  const [clinics, setClinics] = useState<PlatformClinic[]>([])
  const [clinicSearch, setClinicSearch] = useState('')
  const [clinicStatus, setClinicStatus] = useState<'all' | 'active' | 'suspended'>('all')
  const [clinicPage, setClinicPage] = useState(1)
  const [timeZones, setTimeZones] = useState<PlatformTimeZone[]>([])
  const [locales, setLocales] = useState<PlatformLocale[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showProvision, setShowProvision] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<PlatformClinicDetails | null>(null)
  const [edit, setEdit] = useState<UpdatePlatformClinicInput | null>(null)
  const [draft, setDraft] = useState<ProvisionClinicInput>({
    name: '',
    codePrefix: '',
    timeZoneId: '',
    patientNumberPrefix: '',
    locale: '',
    admin: { fullName: '', email: '', password: '' },
  })

  useEffect(() => {
    const refreshAfterReconnect = () => {
      if (!sessionRef.current) return
      const generation = actorGeneration.current
      void (async () => {
        try {
          const active = await activeSession()
          const [items, lookups] = await Promise.all([
            listPlatformClinics(active),
            getPlatformLookups(active),
          ])
          if (
            actorGeneration.current !== generation ||
            sessionRef.current?.refreshToken !== active.refreshToken
          )
            return
          setClinics(items)
          setTimeZones(lookups.timeZones)
          setLocales(lookups.locales)
          setError('')
        } catch {
          if (actorGeneration.current === generation) setError(t('refreshError'))
        }
      })()
    }
    window.addEventListener(connectionRestoredEvent, refreshAfterReconnect)
    return () =>
      window.removeEventListener(connectionRestoredEvent, refreshAfterReconnect)
  })

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const next = await platformLogin(email, password)
      const [items, lookups] = await Promise.all([
        listPlatformClinics(next),
        getPlatformLookups(next),
      ])
      setTimeZones(lookups.timeZones)
      setLocales(lookups.locales)
      actorGeneration.current += 1
      sessionRef.current = next
      setSession(next)
      setClinics(items)
      setPassword('')
    } catch {
      setError(t('signInError'))
    } finally {
      setBusy(false)
    }
  }

  async function reload() {
    if (!session) return
    setBusy(true)
    setError('')
    try {
      setClinics(await listPlatformClinics(await activeSession()))
    } catch {
      setError(t('loadError'))
    } finally {
      setBusy(false)
    }
  }

  async function provision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setBusy(true)
    setError('')
    try {
      await provisionPlatformClinic(await activeSession(), draft)
      setClinics(await listPlatformClinics(await activeSession()))
      setShowProvision(false)
      setDraft({
        name: '',
        codePrefix: '',
        admin: { fullName: '', email: '', password: '' },
      })
    } catch {
      setError(t('provisionError'))
    } finally {
      setBusy(false)
    }
  }

  async function toggleClinic(clinic: PlatformClinic) {
    if (!session) return
    const action = clinic.isActive ? t('suspendAction') : t('reactivateAction')
    if (!window.confirm(t('confirmStatus', { action, name: clinic.name }))) return
    setBusy(true)
    setError('')
    try {
      await setPlatformClinicStatus(await activeSession(), clinic.id, !clinic.isActive)
      setClinics(await listPlatformClinics(await activeSession()))
    } catch {
      setError(t('statusError', { action }))
    } finally {
      setBusy(false)
    }
  }

  async function openDetails(clinicId: string) {
    if (!session) return
    setBusy(true)
    setError('')
    try {
      const details = await getPlatformClinicDetails(await activeSession(), clinicId)
      setSelectedClinic(details)
      setEdit({
        clinicId: details.id,
        name: details.name,
        timeZoneId: details.timeZoneId ?? '',
        patientNumberPrefix: details.patientNumberPrefix ?? '',
        phone: details.phone ?? '',
        email: details.email ?? '',
        address: details.address ?? '',
        website: details.website ?? '',
        locale: details.locale ?? '',
      })
    } catch {
      setError(t('detailsError'))
    } finally {
      setBusy(false)
    }
  }

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !edit) return
    setBusy(true)
    setError('')
    try {
      const updated = await updatePlatformClinic(await activeSession(), edit)
      setSelectedClinic(updated)
      setClinics(await listPlatformClinics(await activeSession()))
      setEdit(null)
    } catch {
      setError(t('saveError'))
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    const active = sessionRef.current
    actorGeneration.current += 1
    sessionRef.current = null
    setSession(null)
    setClinics([])
    setTimeZones([])
    setLocales([])
    setSelectedClinic(null)
    setEdit(null)
    setError('')
    if (active) {
      try {
        await platformLogout(active)
      } catch {
        /* local credentials already cleared */
      }
    }
  }

  if (clinicAuth.session) {
    return (
      <main className="page-shell">
        <p className="state error" role="alert">
          {t('clinicSessionWarning')}
        </p>
        <Link to="/patients">{t('returnToClinic')}</Link>
      </main>
    )
  }

  if (!session)
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-brand">
            <span className="brand-mark" aria-hidden="true">
              A
            </span>
            <span>
              AURAN <small>{t('brand')}</small>
            </span>
          </div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t('signInTitle')}</h1>
          <p className="muted">{t('signInSubtitle')}</p>
          <form className="auth-form" onSubmit={signIn}>
            <label>
              <span>{t('email')}</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              <span>{t('password')}</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="button primary" disabled={busy}>
              {busy ? t('signingIn') : t('platformSignIn')}
            </button>
            <Link to="/login">{t('clinicSignIn')}</Link>
          </form>
        </section>
      </main>
    )

  const searchTerm = clinicSearch.trim().toLocaleLowerCase()
  const visibleClinics = clinics
    .filter(
      (clinic) =>
        (clinicStatus === 'all' || (clinicStatus === 'active') === clinic.isActive) &&
        (!searchTerm ||
          `${clinic.name} ${clinic.code}`.toLocaleLowerCase().includes(searchTerm)),
    )
    .sort((left, right) =>
      (right.createdDate ?? '').localeCompare(left.createdDate ?? ''),
    )
  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(visibleClinics.length / pageSize))
  const currentPage = Math.min(clinicPage, pageCount)
  const pageClinics = visibleClinics.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )
  const activeCount = clinics.filter((clinic) => clinic.isActive).length

  return (
    <main className="page-shell platform-page">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t('clinicsTitle')}</h1>
          <p className="muted">{t('clinicsSubtitle')}</p>
        </div>
        <div className="actions">
          <button
            className="button secondary"
            onClick={() => void reload()}
            disabled={busy}
          >
            {t('refresh')}
          </button>
          <button
            className="button primary"
            onClick={() => setShowProvision((v) => !v)}
            disabled={busy}
          >
            {showProvision ? t('cancel') : t('provisionClinic')}
          </button>
          <button className="button secondary" onClick={() => void signOut()}>
            {t('signOut')}
          </button>
        </div>
      </section>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <section className="platform-summary" aria-label={t('summary')}>
        <KpiCard
          label={t('totalClinics')}
          value={clinics.length}
          icon={Building2}
          tone="blue"
        />
        <KpiCard label={t('active')} value={activeCount} icon={CircleCheck} tone="teal" />
        <KpiCard
          label={t('suspended')}
          value={clinics.length - activeCount}
          icon={CirclePause}
          tone="amber"
        />
      </section>
      {showProvision && (
        <section className="panel">
          <h2>{t('provisionTitle')}</h2>
          <p className="muted">{t('provisionSubtitle')}</p>
          <form className="patient-form" onSubmit={provision}>
            <label>
              <span>{t('clinicName')}</span>
              <input
                required
                maxLength={200}
                value={draft.name}
                onChange={(e) => setDraft((v) => ({ ...v, name: e.target.value }))}
              />
            </label>
            <label>
              <span>{t('codePrefix')}</span>
              <input
                required
                maxLength={20}
                value={draft.codePrefix}
                onChange={(e) => setDraft((v) => ({ ...v, codePrefix: e.target.value }))}
              />
            </label>
            <label>
              <span>{t('timeZoneIana')}</span>
              <select
                value={draft.timeZoneId ?? ''}
                onChange={(e) => setDraft((v) => ({ ...v, timeZoneId: e.target.value }))}
              >
                <option value="">{t('defaultTimeZone')}</option>
                {timeZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.displayName} ({zone.utcOffset})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('patientNumberPrefix')}</span>
              <input
                value={draft.patientNumberPrefix ?? ''}
                onChange={(e) =>
                  setDraft((v) => ({ ...v, patientNumberPrefix: e.target.value }))
                }
              />
            </label>
            <label>
              <span>{t('locale')}</span>
              <select
                value={draft.locale ?? ''}
                onChange={(e) => setDraft((v) => ({ ...v, locale: e.target.value }))}
              >
                <option value="">{t('defaultLocale')}</option>
                {locales.map((locale) => (
                  <option key={locale.code} value={locale.code}>
                    {locale.displayName} — {locale.nativeName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('adminName')}</span>
              <input
                required
                value={draft.admin.fullName}
                onChange={(e) =>
                  setDraft((v) => ({
                    ...v,
                    admin: { ...v.admin, fullName: e.target.value },
                  }))
                }
              />
            </label>
            <label>
              <span>{t('adminEmail')}</span>
              <input
                required
                type="email"
                value={draft.admin.email}
                onChange={(e) =>
                  setDraft((v) => ({
                    ...v,
                    admin: { ...v.admin, email: e.target.value },
                  }))
                }
              />
            </label>
            <label>
              <span>{t('adminPassword')}</span>
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={draft.admin.password}
                onChange={(e) =>
                  setDraft((v) => ({
                    ...v,
                    admin: { ...v.admin, password: e.target.value },
                  }))
                }
              />
            </label>
            <div className="actions full-width">
              <button className="button primary" disabled={busy} type="submit">
                {busy ? t('provisioning') : t('createClinic')}
              </button>
            </div>
          </form>
        </section>
      )}
      {selectedClinic && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('detailsTitle', { code: selectedClinic.code })}</h2>
              <p className="muted">
                {t('detailsSubtitle', { email: selectedClinic.initialAdminEmail ?? '—' })}
              </p>
            </div>
            <button
              className="button secondary"
              onClick={() => {
                setSelectedClinic(null)
                setEdit(null)
              }}
            >
              {t('close')}
            </button>
          </div>
          {edit ? (
            <form className="patient-form" onSubmit={saveDetails}>
              <label>
                <span>{t('clinicName')}</span>
                <input
                  required
                  value={edit.name}
                  onChange={(e) => setEdit((v) => v && { ...v, name: e.target.value })}
                />
              </label>
              <label>
                <span>{t('timeZone')}</span>
                <select
                  value={edit.timeZoneId ?? ''}
                  onChange={(e) =>
                    setEdit((v) => v && { ...v, timeZoneId: e.target.value })
                  }
                >
                  <option value="">{t('defaultTimeZone')}</option>
                  {timeZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.displayName} ({zone.utcOffset})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('patientPrefix')}</span>
                <input
                  value={edit.patientNumberPrefix ?? ''}
                  onChange={(e) =>
                    setEdit((v) => v && { ...v, patientNumberPrefix: e.target.value })
                  }
                />
              </label>
              <label>
                <span>{t('phone')}</span>
                <input
                  type="tel"
                  value={edit.phone ?? ''}
                  onChange={(e) => setEdit((v) => v && { ...v, phone: e.target.value })}
                />
              </label>
              <label>
                <span>{t('email')}</span>
                <input
                  type="email"
                  value={edit.email ?? ''}
                  onChange={(e) => setEdit((v) => v && { ...v, email: e.target.value })}
                />
              </label>
              <label>
                <span>{t('website')}</span>
                <input
                  type="url"
                  value={edit.website ?? ''}
                  onChange={(e) => setEdit((v) => v && { ...v, website: e.target.value })}
                />
              </label>
              <label>
                <span>{t('address')}</span>
                <input
                  value={edit.address ?? ''}
                  onChange={(e) => setEdit((v) => v && { ...v, address: e.target.value })}
                />
              </label>
              <label>
                <span>{t('locale')}</span>
                <select
                  value={edit.locale ?? ''}
                  onChange={(e) => setEdit((v) => v && { ...v, locale: e.target.value })}
                >
                  <option value="">{t('defaultLocale')}</option>
                  {locales.map((locale) => (
                    <option key={locale.code} value={locale.code}>
                      {locale.displayName} — {locale.nativeName}
                    </option>
                  ))}
                </select>
              </label>
              <div className="actions full-width">
                <button className="button primary" type="submit" disabled={busy}>
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          ) : (
            <p className="muted">{t('detailsSaved')}</p>
          )}
        </section>
      )}
      <section className="panel">
        <div className="panel-heading">
          <h2>{t('registeredClinics')}</h2>
          <span className="muted">
            {t('countOf', { visible: visibleClinics.length, total: clinics.length })}
          </span>
        </div>
        <div className="platform-list-filters">
          <input
            className="input"
            aria-label={t('searchClinics')}
            placeholder={t('searchPlaceholder')}
            value={clinicSearch}
            onChange={(event) => {
              setClinicSearch(event.target.value)
              setClinicPage(1)
            }}
          />
          <select
            aria-label={t('clinicStatus')}
            value={clinicStatus}
            onChange={(event) => {
              setClinicStatus(event.target.value as typeof clinicStatus)
              setClinicPage(1)
            }}
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="active">{t('active')}</option>
            <option value="suspended">{t('suspended')}</option>
          </select>
        </div>
        {clinics.length === 0 ? (
          <p className="state">{t('noClinics')}</p>
        ) : visibleClinics.length === 0 ? (
          <p className="state">{t('noMatches')}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('code')}</th>
                  <th>{t('clinic')}</th>
                  <th>{t('status')}</th>
                  <th>{t('timeZone')}</th>
                  <th>{t('created')}</th>
                  <th>{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {pageClinics.map((clinic) => (
                  <tr key={clinic.id}>
                    <td className="mono" dir="ltr">
                      {clinic.code}
                    </td>
                    <td>
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => void openDetails(clinic.id)}
                      >
                        {clinic.name}
                      </button>
                    </td>
                    <td>
                      <span
                        className={`platform-status ${clinic.isActive ? 'active' : 'suspended'}`}
                      >
                        {clinic.isActive ? t('active') : t('suspended')}
                      </span>
                    </td>
                    <td>{clinic.timeZoneId ?? '—'}</td>
                    <td dir="ltr">{clinic.createdDate?.slice(0, 10) ?? '—'}</td>
                    <td>
                      <button
                        className={clinic.isActive ? 'button danger' : 'button secondary'}
                        disabled={busy}
                        onClick={() => void toggleClinic(clinic)}
                      >
                        {clinic.isActive ? t('suspend') : t('reactivate')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {visibleClinics.length > pageSize && (
          <div className="platform-pagination">
            <span>
              {t('showing', {
                from: (currentPage - 1) * pageSize + 1,
                to: Math.min(currentPage * pageSize, visibleClinics.length),
                total: visibleClinics.length,
              })}
            </span>
            <div>
              <button
                className="button secondary"
                disabled={currentPage === 1}
                onClick={() => setClinicPage(currentPage - 1)}
              >
                {t('previous')}
              </button>
              <span>{t('page', { current: currentPage, total: pageCount })}</span>
              <button
                className="button secondary"
                disabled={currentPage === pageCount}
                onClick={() => setClinicPage(currentPage + 1)}
              >
                {t('next')}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
