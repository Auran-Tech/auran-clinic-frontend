import { randomBytes } from 'node:crypto'

const apiBase = process.env.AURAN_DEMO_API_BASE ?? 'http://127.0.0.1:5085/api'
const email = process.env.AURAN_DEMO_EMAIL
const password = process.env.AURAN_DEMO_PASSWORD

if (process.argv[2] !== '--confirm-local' || !email || !password) {
  throw new Error(
    'Use --confirm-local with AURAN_DEMO_EMAIL and AURAN_DEMO_PASSWORD set for a disposable local clinic.',
  )
}
const apiUrl = new URL(apiBase)
if (
  !['127.0.0.1', 'localhost'].includes(apiUrl.hostname) ||
  apiUrl.protocol !== 'http:'
) {
  throw new Error('The demo seed runs only against an HTTP API on this computer.')
}

let token
async function call(path, { method = 'GET', data } = {}) {
  const response = await fetch(
    new URL(apiUrl.pathname.replace(/\/$/, '') + path, apiUrl.origin),
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    },
  )
  const body = await response.json().catch(() => ({}))
  if (!response.ok || body.status === false) {
    throw new Error(
      `${method} ${path}: HTTP ${response.status} ${body.message ?? 'API request failed'}`,
    )
  }
  return body.data
}

function offsetLocalDate(localDate, days) {
  const date = new Date(`${localDate}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const login = await call('/auth/login', { method: 'POST', data: { email, password } })
token = login.accessToken
const summary = {
  doctors: 0,
  patients: 0,
  visits: 0,
  followUps: 0,
  workflow: false,
  queueMoves: 0,
  sessions: 0,
}
const seedPatients = [
  ['Demo Patient 01 - Welcome', '01000001001', 'Female'],
  ['Demo Patient 02 - Waiting', '01000001002', 'Male'],
  ['Demo Patient 03 - Follow-up', '01000001003', 'Female'],
  ['Demo Patient 04 - Profile', '01000001004', 'Male'],
  ['Demo Patient 05 - Records', '01000001005', 'Female'],
  ['Demo Patient 06 - Queue', '01000001006', 'Male'],
  ['Demo Patient 07 - Reports', '01000001007', 'Female'],
  ['Demo Patient 08 - Search', '01000001008', 'Male'],
  ['Demo Patient 09 - Reception', '01000001009', 'Female'],
  ['Demo Patient 10 - Completed', '01000001010', 'Male'],
  ['Demo Patient 11 - Review', '01000001011', 'Female'],
  ['Demo Patient 12 - Recheck', '01000001012', 'Male'],
  ['Demo Patient 13 - History', '01000001013', 'Female'],
  ['Demo Patient 14 - History', '01000001014', 'Male'],
  ['Demo Patient 15 - History', '01000001015', 'Female'],
  ['Demo Patient 16 - History', '01000001016', 'Male'],
  ['Demo Patient 17 - History', '01000001017', 'Female'],
  ['Demo Patient 18 - History', '01000001018', 'Male'],
  ['Demo Patient 19 - History', '01000001019', 'Female'],
  ['Demo Patient 20 - History', '01000001020', 'Male'],
]

const users = await call('/users')
const doctorEmails = [
  'demo.doctor.01@example.invalid',
  'demo.doctor.02@example.invalid',
  'demo.doctor.03@example.invalid',
]
const doctors = []
for (const [index, doctorEmail] of doctorEmails.entries()) {
  let doctor = users.find((user) => user.email === doctorEmail)
  if (!doctor) {
    doctor = await call('/users', {
      method: 'POST',
      data: {
        fullName: `Demo Doctor 0${index + 1}`,
        email: doctorEmail,
        password: `${randomBytes(24).toString('base64url')}Aa1!`,
        roles: ['DOCTOR'],
        isSuperUser: false,
      },
    })
    summary.doctors += 1
  }
  doctors.push(doctor)
}

let workflow = await call('/workflow-config')
const demoCodes = new Set([
  'WAITING',
  'WITH_DOCTOR',
  'WAITING_DROPS',
  'READY_RECHECK',
  'EXIT',
])
const isDemoWorkflow = workflow.statuses.every((status) => demoCodes.has(status.code))
if (isDemoWorkflow) {
  const expectedStatuses = [
    { code: 'WAITING', name: 'Waiting', color: '#3b82f6', sortOrder: 0 },
    { code: 'WITH_DOCTOR', name: 'With doctor', color: '#22a06b', sortOrder: 1 },
    { code: 'WAITING_DROPS', name: 'Waiting for drops', color: '#d99a00', sortOrder: 2 },
    { code: 'READY_RECHECK', name: 'Ready for recheck', color: '#7c4dff', sortOrder: 3 },
    { code: 'EXIT', name: 'Exited', color: '#10b981', sortOrder: 4, isSystemFinal: true },
  ]
  for (const status of expectedStatuses) {
    if (!workflow.statuses.some((item) => item.code === status.code)) {
      workflow = await call('/workflow-config/statuses', {
        method: 'POST',
        data: status,
      })
      summary.workflow = true
    }
  }

  const statusByCode = Object.fromEntries(
    workflow.statuses.map((status) => [status.code, status]),
  )
  const desiredPairs = [
    ['WAITING', 'EXIT'],
    ['WAITING', 'WITH_DOCTOR'],
    ['WAITING', 'WAITING_DROPS'],
    ['WAITING', 'READY_RECHECK'],
    ['WITH_DOCTOR', 'READY_RECHECK'],
    ['WITH_DOCTOR', 'EXIT'],
    ['WAITING_DROPS', 'READY_RECHECK'],
    ['READY_RECHECK', 'EXIT'],
  ]
  const transitions = [...workflow.transitions]
  for (const [from, to] of desiredPairs) {
    const fromStatusId = statusByCode[from].id
    const toStatusId = statusByCode[to].id
    if (
      !transitions.some(
        (item) => item.fromStatusId === fromStatusId && item.toStatusId === toStatusId,
      )
    ) {
      transitions.push({ fromStatusId, toStatusId })
    }
  }
  if (transitions.length !== workflow.transitions.length) {
    workflow = await call('/workflow-config/transitions', {
      method: 'PUT',
      data: { transitions },
    })
    summary.workflow = true
  }
}
const statusByCode = Object.fromEntries(
  workflow.statuses.map((status) => [status.code, status]),
)
const waiting = statusByCode.WAITING
const exited = statusByCode.EXIT
const canSeedVisits = Boolean(
  waiting &&
  exited &&
  workflow.transitions.some(
    (item) => item.fromStatusId === waiting.id && item.toStatusId === exited.id,
  ),
)

const patients = []
for (const [name, phone, gender] of seedPatients) {
  const listing = await call(
    `/patients?search=${encodeURIComponent(name)}&page=1&pageSize=20`,
  )
  let patient = (listing.data ?? []).find((item) => item.fullName === name)
  if (!patient) {
    patient = await call('/patients', {
      method: 'POST',
      data: {
        fullName: name,
        phone,
        gender,
        notes: 'Synthetic local demo record. No real patient data.',
      },
    })
    summary.patients += 1
  }
  patients.push(patient)
}

if (canSeedVisits) {
  const visits = []
  for (const [index, patient] of patients.slice(0, 12).entries()) {
    const history = await call(
      `/visits/history?patientId=${encodeURIComponent(patient.id)}`,
    )
    let visit = history.visits?.data?.[0]
    if (!visit) {
      visit = await call('/visits/start', {
        method: 'POST',
        data: {
          patientId: patient.id,
          doctorId: doctors[index % doctors.length].id,
        },
      })
      summary.visits += 1
    }
    visits.push(visit)
  }

  const activeQueue = await call('/queue')
  const legacyDemoPatients = new Set([
    'Demo Patient 01 - Welcome',
    'Demo Patient 02 - Waiting',
  ])
  for (const entry of activeQueue) {
    const normalizedEntryTime = /(?:Z|[+-]\d\d:\d\d)$/i.test(entry.entryAtUtc)
      ? entry.entryAtUtc
      : `${entry.entryAtUtc}Z`
    const entryTimestamp = Date.parse(normalizedEntryTime)
    const isOldDemoEntry =
      legacyDemoPatients.has(entry.patientName) &&
      Number.isFinite(entryTimestamp) &&
      Date.now() - entryTimestamp > 24 * 60 * 60 * 1_000
    if (isOldDemoEntry && entry.workflowStatusId === waiting.id) {
      await call('/queue/move', {
        method: 'PUT',
        data: {
          queueEntryId: entry.queueEntryId,
          toWorkflowStatusId: exited.id,
        },
      })
      summary.queueMoves += 1
    }
  }
  const moves = new Map([
    [2, 'EXIT'],
    [4, 'WITH_DOCTOR'],
    [6, 'READY_RECHECK'],
    [8, 'WAITING_DROPS'],
    [9, 'EXIT'],
    [10, 'EXIT'],
    [11, 'WITH_DOCTOR'],
  ])
  for (const [index, destinationCode] of moves) {
    const visitId = visits[index].id ?? visits[index].visitId
    const queueEntry = activeQueue.find((entry) => entry.visitId === visitId)
    const destination = statusByCode[destinationCode]
    if (
      queueEntry &&
      destination &&
      queueEntry.workflowStatusId === waiting.id &&
      workflow.transitions.some(
        (transition) =>
          transition.fromStatusId === waiting.id &&
          transition.toStatusId === destination.id,
      )
    ) {
      await call('/queue/move', {
        method: 'PUT',
        data: {
          queueEntryId: queueEntry.queueEntryId,
          toWorkflowStatusId: destination.id,
        },
      })
      summary.queueMoves += 1
    }
  }

  const documentationPlans = new Map([
    [4, 'Draft'],
    [6, 'Pending'],
    [8, 'Pending'],
    [11, 'Draft'],
  ])
  for (const [index, desiredStatus] of documentationPlans) {
    const visit = visits[index]
    if (visit.documentationStatus !== 'NotStarted') continue
    const visitId = visit.id ?? visit.visitId
    await call('/clinical-sessions/start', {
      method: 'POST',
      data: { visitId },
    })
    if (desiredStatus === 'Pending') {
      await call('/clinical-sessions/end', {
        method: 'PUT',
        data: { visitId },
      })
    }
    summary.sessions += 1
  }

  const localDate = (await call('/reporting/dashboard')).localDate
  const followUps = await call('/follow-ups?bucket=All')
  const followUpPlans = [
    [2, offsetLocalDate(localDate, -1)],
    [9, localDate],
    [10, localDate],
    [11, offsetLocalDate(localDate, 1)],
  ]
  for (const [index, recommendedDate] of followUpPlans) {
    const visitId = visits[index].id ?? visits[index].visitId
    if (!followUps.some((item) => item.visitId === visitId)) {
      await call('/follow-ups', {
        method: 'POST',
        data: {
          visitId,
          recommendation: 'Synthetic follow-up for local workflow review only.',
          recommendedDate,
        },
      })
      summary.followUps += 1
    }
  }
}

console.log('Local synthetic demo seed complete:', summary)
if (!canSeedVisits)
  console.log(
    'Existing workflow configuration was preserved; visits were skipped because WAITING to EXIT is unavailable.',
  )
