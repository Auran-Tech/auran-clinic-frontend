import { test, expect } from '@playwright/test'

const api = process.env.E2E_API_BASE_URL

test('Excel export downloads actual XLSX using the clinic actor and filtered report', async ({ page, request }) => {
  test.skip(!api, 'Requires real API and disposable SQL')
  const email = process.env.PlatformBootstrap__Email
  const password = process.env.PlatformBootstrap__Password
  if (!email || !password) throw new Error('Missing disposable bootstrap credentials')

  const platformLogin = await request.post(api + '/platform/auth/login', {
    data: { email, password },
  })
  expect(platformLogin.status()).toBe(200)
  const platformToken = (await platformLogin.json()).data.accessToken
  const suffix = Date.now().toString(36)
  const admin = {
    fullName: 'Report Export Admin',
    email: 'excel-export-' + suffix + '@example.invalid',
    password,
  }
  const create = await request.post(api + '/platform/clinics', {
    headers: { Authorization: 'Bearer ' + platformToken },
    data: { name: 'Report Export ' + suffix, codePrefix: 'XL', admin },
  })
  expect(create.status()).toBe(201)

  const clinicLogin = await request.post(api + '/auth/login', {
    data: { email: admin.email, password },
  })
  expect(clinicLogin.status()).toBe(200)
  const clinicToken = (await clinicLogin.json()).data.accessToken
  // Platform token must never be accepted by clinic report endpoints.
  const wrongActor = await request.get(api + '/reporting/visits/export/xlsx', {
    headers: { Authorization: 'Bearer ' + platformToken },
  })
  expect(wrongActor.status()).toBe(403)

  const backendResponse = await request.get(api + '/reporting/visits/export/xlsx', {
    headers: { Authorization: 'Bearer ' + clinicToken },
    params: { fromDate: '2026-10-01', toDate: '2026-10-31' },
  })
  expect(backendResponse.status()).toBe(200)
  expect(backendResponse.headers()['content-type']).toContain('spreadsheetml.sheet')
  const backendBytes = await backendResponse.body()
  expect(backendBytes.subarray(0, 2).toString()).toBe('PK')

  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await page.goto('/reports')
  await expect(page.getByRole('heading', { name: 'Dashboard & reports' })).toBeVisible()
  await page.getByLabel('From date').fill('2026-10-01')
  await page.getByLabel('To date').fill('2026-10-31')
  const responsePromise = page.waitForResponse(r =>
    r.url().includes('/reporting/visits/export/xlsx') && r.request().method() === 'GET')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export Excel (.xlsx)' }).click()
  const response = await responsePromise
  const download = await downloadPromise
  expect(response.status()).toBe(200)
  expect(download.suggestedFilename()).toMatch(/^auran-visits-.*\.xlsx$/)
  expect(await download.failure()).toBeNull()
})
