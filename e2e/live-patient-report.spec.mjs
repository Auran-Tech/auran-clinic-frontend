import { expect, test } from '@playwright/test'

const api = process.env.E2E_API_BASE_URL

test('patient reporting respects clinic tenant and downloads filtered CSV', async ({ page, request }) => {
  test.skip(!api, 'Requires real API and disposable SQL')
  const platformEmail = process.env.PlatformBootstrap__Email
  const password = process.env.PlatformBootstrap__Password
  if (!platformEmail || !password) throw new Error('Missing disposable bootstrap credentials')

  const platformLogin = await request.post(api + '/platform/auth/login', {
    data: { email: platformEmail, password },
  })
  expect(platformLogin.status()).toBe(200)
  const platformToken = (await platformLogin.json()).data.accessToken
  const unique = Date.now().toString(36)
  const admin = { fullName: 'Report QA Admin', email: 'patientreport-' + unique + '@example.invalid', password }
  const clinic = await request.post(api + '/platform/clinics', {
    headers: { Authorization: 'Bearer ' + platformToken },
    data: { name: 'Patient Report QA ' + unique, codePrefix: 'RP', admin },
  })
  expect(clinic.status()).toBe(201)

  const login = await request.post(api + '/auth/login', { data: { email: admin.email, password } })
  expect(login.status()).toBe(200)
  const clinicToken = (await login.json()).data.accessToken
  const authHeaders = { Authorization: 'Bearer ' + clinicToken }
  const created = await request.post(api + '/patients', {
    headers: authHeaders,
    data: { fullName: 'Report Patient ' + unique, phone: '+2010' + unique.replace(/\D/g, '').slice(-8).padStart(8, '0'), gender: 'Female' },
  })
  expect(created.status()).toBe(201)

  const wrongActor = await request.get(api + '/reporting/patients/export', {
    headers: { Authorization: 'Bearer ' + platformToken },
  })
  expect(wrongActor.status()).toBe(403)

  const preview = await request.get(api + '/reporting/patients', {
    headers: authHeaders, params: { gender: 'Female' },
  })
  expect(preview.status()).toBe(200)
  expect((await preview.json()).data.rows.some(row => row.patientName === 'Report Patient ' + unique)).toBe(true)

  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await page.goto('/reports')
  await expect(page.getByRole('heading', { name: 'Patients report' })).toBeVisible()
  await expect(page.getByText('Report Patient ' + unique)).toBeVisible()
  await page.getByLabel('Gender').fill('Female')
  const downloadPromise = page.waitForEvent('download')
  const responsePromise = page.waitForResponse(r => r.url().includes('/reporting/patients/export') && r.request().method() === 'GET')
  await page.getByRole('button', { name: 'Export patients CSV' }).click()
  expect((await responsePromise).status()).toBe(200)
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^auran-patients-.*\.csv$/)
  expect(await download.failure()).toBeNull()
})
