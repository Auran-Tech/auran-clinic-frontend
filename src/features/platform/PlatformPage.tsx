import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getPlatformClinicDetails, listPlatformClinics, platformLogin, platformLogout, provisionPlatformClinic, setPlatformClinicStatus, updatePlatformClinic,
  type PlatformClinic, type PlatformClinicDetails, type PlatformSession, type ProvisionClinicInput, type UpdatePlatformClinicInput,
} from './api'

export function PlatformPage() {
  const clinicAuth = useAuth()
  // Deliberately memory-only. A page reload requires re-authentication as Platform.
  const [session, setSession] = useState<PlatformSession | null>(null)
  const [clinics, setClinics] = useState<PlatformClinic[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showProvision, setShowProvision] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<PlatformClinicDetails | null>(null)
  const [edit, setEdit] = useState<UpdatePlatformClinicInput | null>(null)
  const [draft, setDraft] = useState<ProvisionClinicInput>({
    name: '', codePrefix: '', timeZoneId: '', patientNumberPrefix: '', locale: '',
    admin: { fullName: '', email: '', password: '' },
  })

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const next = await platformLogin(email, password)
      const items = await listPlatformClinics(next)
      setSession(next); setClinics(items); setPassword('')
    } catch {
      setError('Platform sign-in failed. Check the credentials or connection.')
    } finally { setBusy(false) }
  }

  async function reload() {
    if (!session) return
    setBusy(true); setError('')
    try { setClinics(await listPlatformClinics(session)) }
    catch { setError('Unable to load platform clinics. Sign in again if your session expired.') }
    finally { setBusy(false) }
  }

  async function provision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setBusy(true); setError('')
    try {
      await provisionPlatformClinic(session, draft)
      setClinics(await listPlatformClinics(session))
      setShowProvision(false)
      setDraft({ name: '', codePrefix: '', admin: { fullName: '', email: '', password: '' } })
    } catch {
      setError('Provisioning failed. Check the fields and whether the clinic or admin already exists.')
    } finally { setBusy(false) }
  }

  async function toggleClinic(clinic: PlatformClinic) {
    if (!session) return
    const action = clinic.isActive ? 'suspend' : 'reactivate'
    if (!window.confirm(`Are you sure you want to ${action} ${clinic.name}? Suspending invalidates active clinic sessions.`)) return
    setBusy(true); setError('')
    try {
      await setPlatformClinicStatus(session, clinic.id, !clinic.isActive)
      setClinics(await listPlatformClinics(session))
    } catch { setError(`Unable to ${action} clinic.`) }
    finally { setBusy(false) }
  }

  async function openDetails(clinicId: string) {
    if (!session) return
    setBusy(true); setError('')
    try {
      const details = await getPlatformClinicDetails(session, clinicId)
      setSelectedClinic(details)
      setEdit({
        clinicId: details.id, name: details.name,
        timeZoneId: details.timeZoneId ?? '', patientNumberPrefix: details.patientNumberPrefix ?? '',
        phone: details.phone ?? '', email: details.email ?? '', address: details.address ?? '',
        website: details.website ?? '', locale: details.locale ?? '',
      })
    } catch { setError('Unable to load clinic details.') }
    finally { setBusy(false) }
  }

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !edit) return
    setBusy(true); setError('')
    try {
      const updated = await updatePlatformClinic(session, edit)
      setSelectedClinic(updated)
      setClinics(await listPlatformClinics(session))
      setEdit(null)
    } catch { setError('Unable to save clinic details. Review the fields and retry.') }
    finally { setBusy(false) }
  }

  async function signOut() {
    const active = session
    setSession(null); setClinics([]); setSelectedClinic(null); setEdit(null); setError('')
    if (active) { try { await platformLogout(active) } catch { /* local credentials already cleared */ } }
  }

  if (clinicAuth.session) {
    return <main className="page-shell"><p className="state error" role="alert">Sign out of the clinic workspace before using Platform Administration.</p><Link to="/patients">Return to clinic</Link></main>
  }

  if (!session) return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Auran Platform</p>
        <h1>Platform administration</h1>
        <p className="muted">Platform accounts cannot access clinic patient data.</p>
        <form className="auth-form" onSubmit={signIn}>
          <label><span>Email</span><input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label><span>Password</span><input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button type="submit" className="button primary" disabled={busy}>{busy ? 'Signing in…' : 'Platform sign in'}</button>
          <Link to="/login">Clinic sign in</Link>
        </form>
      </section>
    </main>
  )

  return (
    <main className="page-shell">
      <section className="page-header">
        <div><p className="eyebrow">Auran Platform</p><h1>Clinics</h1><p className="muted">Operational clinic management only. No patient records.</p></div>
        <div className="actions">
          <button className="button secondary" onClick={() => void reload()} disabled={busy}>Refresh</button>
          <button className="button primary" onClick={() => setShowProvision(v => !v)} disabled={busy}>{showProvision ? 'Cancel' : 'Provision clinic'}</button>
          <button className="button secondary" onClick={() => void signOut()}>Sign out</button>
        </div>
      </section>
      {error && <p className="field-error" role="alert">{error}</p>}
      {showProvision && (
        <section className="panel">
          <h2>Provision new clinic</h2>
          <p className="muted">The server generates the clinic code and creates the initial protected administrator.</p>
          <form className="patient-form" onSubmit={provision}>
            <label><span>Clinic name</span><input required maxLength={200} value={draft.name} onChange={e => setDraft(v => ({...v,name:e.target.value}))} /></label>
            <label><span>Code prefix</span><input required maxLength={20} value={draft.codePrefix} onChange={e => setDraft(v => ({...v,codePrefix:e.target.value}))} /></label>
            <label><span>Time zone (IANA)</span><input value={draft.timeZoneId ?? ''} onChange={e => setDraft(v => ({...v,timeZoneId:e.target.value}))} placeholder="Africa/Cairo" /></label>
            <label><span>Patient number prefix</span><input value={draft.patientNumberPrefix ?? ''} onChange={e => setDraft(v => ({...v,patientNumberPrefix:e.target.value}))} /></label>
            <label><span>Initial admin full name</span><input required value={draft.admin.fullName} onChange={e => setDraft(v => ({...v,admin:{...v.admin,fullName:e.target.value}}))} /></label>
            <label><span>Initial admin email</span><input required type="email" value={draft.admin.email} onChange={e => setDraft(v => ({...v,admin:{...v.admin,email:e.target.value}}))} /></label>
            <label><span>Initial admin password</span><input required type="password" autoComplete="new-password" minLength={8} value={draft.admin.password} onChange={e => setDraft(v => ({...v,admin:{...v.admin,password:e.target.value}}))} /></label>
            <div className="actions full-width"><button className="button primary" disabled={busy} type="submit">{busy ? 'Provisioning…' : 'Create clinic'}</button></div>
          </form>
        </section>
      )}
      {selectedClinic && (
        <section className="panel">
          <div className="panel-heading">
            <div><h2>Clinic details — {selectedClinic.code}</h2><p className="muted">Generated clinic code is immutable. Initial administrator: {selectedClinic.initialAdminEmail ?? '—'}</p></div>
            <button className="button secondary" onClick={() => { setSelectedClinic(null); setEdit(null) }}>Close</button>
          </div>
          {edit ? (
            <form className="patient-form" onSubmit={saveDetails}>
              <label><span>Clinic name</span><input required value={edit.name} onChange={e => setEdit(v => v && ({...v,name:e.target.value}))} /></label>
              <label><span>Time zone</span><input value={edit.timeZoneId ?? ''} onChange={e => setEdit(v => v && ({...v,timeZoneId:e.target.value}))} /></label>
              <label><span>Patient prefix</span><input value={edit.patientNumberPrefix ?? ''} onChange={e => setEdit(v => v && ({...v,patientNumberPrefix:e.target.value}))} /></label>
              <label><span>Phone</span><input type="tel" value={edit.phone ?? ''} onChange={e => setEdit(v => v && ({...v,phone:e.target.value}))} /></label>
              <label><span>Email</span><input type="email" value={edit.email ?? ''} onChange={e => setEdit(v => v && ({...v,email:e.target.value}))} /></label>
              <label><span>Website</span><input type="url" value={edit.website ?? ''} onChange={e => setEdit(v => v && ({...v,website:e.target.value}))} /></label>
              <label><span>Address</span><input value={edit.address ?? ''} onChange={e => setEdit(v => v && ({...v,address:e.target.value}))} /></label>
              <label><span>Locale</span><input value={edit.locale ?? ''} onChange={e => setEdit(v => v && ({...v,locale:e.target.value}))} /></label>
              <div className="actions full-width"><button className="button primary" type="submit" disabled={busy}>Save changes</button></div>
            </form>
          ) : <p className="muted">Clinic metadata saved. Select another clinic to edit its details.</p>}
        </section>
      )}
      <section className="panel">
        <h2>Registered clinics</h2>
        {clinics.length === 0 ? <p className="state">No clinics found.</p> : (
          <div className="table-wrap"><table><thead><tr><th>Clinic</th><th>Code</th><th>Status</th><th>Time zone</th><th>Action</th></tr></thead>
            <tbody>{clinics.map(clinic => <tr key={clinic.id}>
              <td><button className="button secondary" disabled={busy} onClick={() => void openDetails(clinic.id)}>{clinic.name}</button></td><td className="mono">{clinic.code}</td>
              <td>{clinic.isActive ? 'Active' : 'Suspended'}</td><td>{clinic.timeZoneId ?? '—'}</td>
              <td><button className={clinic.isActive ? 'button danger' : 'button secondary'} disabled={busy} onClick={() => void toggleClinic(clinic)}>{clinic.isActive ? 'Suspend' : 'Reactivate'}</button></td>
            </tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  )
}
