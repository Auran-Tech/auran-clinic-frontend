import { test, expect } from '@playwright/test'

const api = process.env.E2E_API_BASE_URL

test('doctor activity preview and CSV keep tenant and platform actor boundaries', async ({ page, request }) => {
  test.skip(!api, 'Requires live .NET, disposable SQL and frontend')
  const email = process.env.PlatformBootstrap__Email
  const password = process.env.PlatformBootstrap__Password
  if (!email || !password) throw new Error('Missing disposable CI admin credentials')

  const platformLogin = await request.post(api + '/platform/auth/login', { data: { email, password } })
  expect(platformLogin.status()).toBe(200)
  const platformToken = (await platformLogin.json()).data.accessToken
  const unique = Date.now().toString(36)
  const admin = { fullName: 'Doctor Metrics Admin', email: 'doctoractivity-' + unique + '@example.invalid', password }
  const clinic = await request.post(api + '/platform/clinics', {
    headers: { Authorization: 'Bearer ' + platformToken },
    data: { name: 'Doctor Metrics ' + unique, codePrefix: 'DA', admin },
  })
  expect(clinic.status()).toBe(201)

  const login = await request.post(api + '/auth/login', { data: { email: admin.email, password } })
  expect(login.status()).toBe(200)
  const clinicToken = (await login.json()).data.accessToken
  const clinicHeaders = { Authorization: 'Bearer ' + clinicToken }
  const wrongActor = await request.get(api + '/reporting/doctors/export', {
    headers: { Authorization: 'Bearer ' + platformToken },
  })
  expect(wrongActor.status()).toBe(403)
  const invalid = await request.get(api + '/reporting/doctors', {
    headers: clinicHeaders, params: { fromDate: '2026-10-17', toDate: '2026-10-01' },
  })
  expect(invalid.status()).toBe(400)
  const preview = await request.get(api + '/reporting/doctors', { headers: clinicHeaders })
  expect(preview.status()).toBe(200)
  const body = (await preview.json()).data
  expect(Array.isArray(body.rows)).toBe(true)
  expect(body.rows.every(row => row.currentQueue >= 0 && row.totalVisits >= 0)).toBe(true)

  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await page.goto('/reports')
  await expect(page.getByRole('heading', { name: 'Doctor activity report' })).toBeVisible()
  await expect(page.getByText(body.totalCount + ' doctors')).toBeVisible()
  const responsePromise = page.waitForResponse(r => r.url().includes('/reporting/doctors/export') && r.request().method() === 'GET')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export doctor CSV' }).click()
  expect((await responsePromise).status()).toBe(200)
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^auran-doctors-.*\.csv$/)
  expect(await download.failure()).toBeNull()
})
