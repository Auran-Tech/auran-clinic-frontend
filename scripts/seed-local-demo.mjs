import { randomBytes } from 'node:crypto'

const apiBase = process.env.AURAN_DEMO_API_BASE ?? 'http://127.0.0.1:5085/api'
const email = process.env.AURAN_DEMO_EMAIL
const password = process.env.AURAN_DEMO_PASSWORD

if (process.argv[2] !== '--confirm-local' || !email || !password) {
  throw new Error('Use --confirm-local with AURAN_DEMO_EMAIL and AURAN_DEMO_PASSWORD set for a disposable local clinic.')
}
const apiUrl = new URL(apiBase)
if (!['127.0.0.1', 'localhost'].includes(apiUrl.hostname) || apiUrl.protocol !== 'http:') {
  throw new Error('The demo seed runs only against an HTTP API on this computer.')
}

let token
async function call(path, { method = 'GET', data } = {}) {
  const response = await fetch(new URL(apiUrl.pathname.replace(/\/$/, '') + path, apiUrl.origin), {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || body.status === false) {
    throw new Error(`${method} ${path}: HTTP ${response.status} ${body.message ?? 'API request failed'}`)
  }
  return body.data
}

const login = await call('/auth/login', { method: 'POST', data: { email, password } })
token = login.accessToken
const summary = { doctors: 0, patients: 0, visits: 0, followUps: 0, workflow: false }
const seedPatients = [
  ['Demo Patient 01 - Welcome', '01000001001', 'Female'],
  ['Demo Patient 02 - Waiting', '01000001002', 'Male'],
  ['Demo Patient 03 - Follow-up', '01000001003', 'Female'],
  ['Demo Patient 04 - Profile', '01000001004', 'Male'],
  ['Demo Patient 05 - Records', '01000001005', 'Female'],
  ['Demo Patient 06 - Queue', '01000001006', 'Male'],
  ['Demo Patient 07 - Reports', '01000001007', 'Female'],
  ['Demo Patient 08 - Search', '01000001008', 'Male'],
]

const users = await call('/users')
const doctorEmails = ['demo.doctor.01@example.invalid', 'demo.doctor.02@example.invalid']
const doctors = []
for (const [index, doctorEmail] of doctorEmails.entries()) {
  let doctor = users.find(user => user.email === doctorEmail)
  if (!doctor) {
    doctor = await call('/users', { method: 'POST', data: {
      fullName: `Demo Doctor 0${index + 1}`,
      email: doctorEmail,
      password: `${randomBytes(24).toString('base64url')}Aa1!`,
      roles: ['DOCTOR'],
      isSuperUser: false,
    } })
    summary.doctors += 1
  }
  doctors.push(doctor)
}

let workflow = await call('/workflow-config')
if (workflow.statuses.every(item => ['WAITING', 'EXIT'].includes(item.code))) {
  if (!workflow.statuses.some(item => item.code === 'WAITING')) {
    workflow = await call('/workflow-config/statuses', { method: 'POST', data: { code: 'WAITING', name: 'Waiting', color: '#3b82f6', sortOrder: 0 } })
    summary.workflow = true
  }
  if (!workflow.statuses.some(item => item.code === 'EXIT')) {
    workflow = await call('/workflow-config/statuses', { method: 'POST', data: { code: 'EXIT', name: 'Exited', color: '#10b981', sortOrder: 1, isSystemFinal: true } })
    summary.workflow = true
  }
  const waiting = workflow.statuses.find(item => item.code === 'WAITING')
  const exited = workflow.statuses.find(item => item.code === 'EXIT')
  if (workflow.transitions.length === 0) {
    workflow = await call('/workflow-config/transitions', { method: 'PUT', data: { transitions: [{ fromStatusId: waiting.id, toStatusId: exited.id }] } })
    summary.workflow = true
  }
}
const waiting = workflow.statuses.find(item => item.code === 'WAITING')
const exited = workflow.statuses.find(item => item.code === 'EXIT')
const canSeedVisits = Boolean(waiting && exited && workflow.transitions.some(item => item.fromStatusId === waiting.id && item.toStatusId === exited.id))

const patients = []
for (const [name, phone, gender] of seedPatients) {
  const listing = await call(`/patients?search=${encodeURIComponent(name)}&page=1&pageSize=20`)
  let patient = (listing.data ?? []).find(item => item.fullName === name)
  if (!patient) {
    patient = await call('/patients', { method: 'POST', data: { fullName: name, phone, gender, notes: 'Synthetic local demo record. No real patient data.' } })
    summary.patients += 1
  }
  patients.push(patient)
}

if (canSeedVisits) {
  for (const [index, patient] of patients.slice(0, 3).entries()) {
    const history = await call(`/visits/history?patientId=${encodeURIComponent(patient.id)}`)
    let visit = history.visits?.data?.[0]
    if (!visit) {
      visit = await call('/visits/start', { method: 'POST', data: { patientId: patient.id, doctorId: doctors[index % doctors.length].id } })
      summary.visits += 1
    }
    if (index === 2) {
      if (visit.queueEntryId) await call('/queue/move', { method: 'PUT', data: { queueEntryId: visit.queueEntryId, toWorkflowStatusId: exited.id } })
      const followUps = await call('/follow-ups?bucket=All')
      const visitId = visit.id ?? visit.visitId
      if (!followUps.some(item => item.visitId === visitId)) {
        const date = new Date()
        date.setDate(date.getDate() + 1)
        await call('/follow-ups', { method: 'POST', data: { visitId, recommendation: 'Demo follow-up for workflow review only.', recommendedDate: date.toISOString().slice(0, 10) } })
        summary.followUps += 1
      }
    }
  }
}

console.log('Local synthetic demo seed complete:', summary)
if (!canSeedVisits) console.log('Existing workflow configuration was preserved; visits were skipped because WAITING to EXIT is unavailable.')
