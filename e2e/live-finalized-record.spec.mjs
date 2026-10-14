import { test, expect } from '@playwright/test'
import { authenticatedHeaders, configureQueue, createDoctor } from './live-clinical-flow.helpers.mjs'
import { verifyFinalizedRecordImmutability } from './live-finalized-record.helpers.mjs'

test('completed clinical records reject overwrite and reopening', async ({ request }) => {
  const api = process.env.E2E_API_BASE_URL
  test.skip(!api, 'Requires live API and disposable SQL Server')
  const email = process.env.PlatformBootstrap__Email
  const password = process.env.PlatformBootstrap__Password
  if (!email || !password) throw new Error('Missing CI platform fixture')
  const platformLogin = await request.post(api + '/platform/auth/login', { data: { email, password } })
  expect(platformLogin.status()).toBe(200)
  const platformToken = (await platformLogin.json()).data.accessToken
  const id = Date.now().toString(36)
  const admin = { fullName: 'Immutability Clinic Admin', email: 'immutable-' + id + '@example.invalid', password }
  const clinic = await request.post(api + '/platform/clinics', {
    headers: authenticatedHeaders(platformToken),
    data: { name: 'Immutable Records Clinic ' + id, codePrefix: 'CI', admin },
  })
  expect(clinic.status(), await clinic.text()).toBe(201)
  const clinicLogin = await request.post(api + '/auth/login', {
    data: { email: admin.email, password },
  })
  expect(clinicLogin.status()).toBe(200)
  const token = (await clinicLogin.json()).data.accessToken
  await configureQueue(request, api, token)
  const doctorId = await createDoctor(request, api, token, 'immutable-doctor-' + id + '@example.invalid', password)
  await verifyFinalizedRecordImmutability(request, api, token, doctorId)
})
