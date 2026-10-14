import { expect } from '@playwright/test'
import { authenticatedHeaders } from './live-clinical-flow.helpers.mjs'

export async function verifyFinalizedRecordImmutability(request, api, token, doctorId) {
  const headers = authenticatedHeaders(token)
  const id = Date.now().toString(36)
  const patientResult = await request.post(api + '/patients', {
    headers,
    data: { fullName: 'Immutable Note Patient ' + id, phone: '011' + String(Date.now()).slice(-8) },
  })
  expect(patientResult.status(), await patientResult.text()).toBe(201)
  const patient = (await patientResult.json()).data

  const checkIn = await request.post(api + '/visits/start', {
    headers, data: { patientId: patient.id, doctorId },
  })
  expect(checkIn.status(), await checkIn.text()).toBe(201)
  const visit = (await checkIn.json()).data

  const started = await request.post(api + '/clinical-sessions/start', {
    headers, data: { visitId: visit.id },
  })
  expect(started.status(), await started.text()).toBe(201)

  const draft = await request.put(api + '/clinical-sessions/documentation', {
    headers, data: { visitId: visit.id, notes: 'Original signed clinical text' },
  })
  expect(draft.status(), await draft.text()).toBe(200)

  const completed = await request.put(api + '/pending-documentation/complete', {
    headers, data: { visitId: visit.id, notes: 'Original signed clinical text' },
  })
  expect(completed.status(), await completed.text()).toBe(200)
  expect((await completed.json()).data.documentationStatus).toBe('Completed')

  const overwrite = await request.put(api + '/clinical-sessions/documentation', {
    headers, data: { visitId: visit.id, notes: 'Unauthorized post-completion revision' },
  })
  expect(overwrite.status()).toBe(409)
  expect((await overwrite.json()).error).toBe('documentation_already_completed')

  const reopening = await request.post(api + '/clinical-sessions/start', {
    headers, data: { visitId: visit.id },
  })
  expect(reopening.status()).toBe(409)
  expect((await reopening.json()).error).toBe('documentation_already_completed')

  const stillActive = await request.get(api + '/clinical-sessions/active?visitId=' + visit.id, { headers })
  expect(stillActive.status()).toBe(200)
  expect((await stillActive.json()).data.notes).toBe('Original signed clinical text')
  const ended = await request.put(api + '/clinical-sessions/end', {
    headers, data: { visitId: visit.id },
  })
  expect(ended.status()).toBe(200)
  expect((await ended.json()).data.documentationStatus).toBe('Completed')
}
