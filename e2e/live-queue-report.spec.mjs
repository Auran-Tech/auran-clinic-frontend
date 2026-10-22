import { test, expect } from '@playwright/test'

const api = process.env.E2E_API_BASE_URL

test('queue report enforces clinic actor and delivers CSV via browser', async ({ page, request }) => {
  test.skip(!api, 'Requires disposable SQL + hosted .NET API')
  const email = process.env.PlatformBootstrap__Email
  const password = process.env.PlatformBootstrap__Password
  if (!email || !password) throw new Error('Missing CI platform fixture')

  const platformLogin = await request.post(api + '/platform/auth/login', { data: { email, password } })
  expect(platformLogin.status()).toBe(200)
  const platformToken = (await platformLogin.json()).data.accessToken
  const unique = Date.now().toString(36)
  const admin = { fullName: 'Queue Report Admin', email: 'queuereport-' + unique + '@example.invalid', password }
  const provision = await request.post(api + '/platform/clinics', {
    headers: { Authorization: 'Bearer ' + platformToken },
    data: { name: 'Queue Report CI ' + unique, codePrefix: 'QR', admin },
  })
  expect(provision.status()).toBe(201)

  const login = await request.post(api + '/auth/login', { data: { email: admin.email, password } })
  expect(login.status()).toBe(200)
  const clinicToken = (await login.json()).data.accessToken
  const clinicHeaders = { Authorization: 'Bearer ' + clinicToken }

  const wrongActor = await request.get(api + '/reporting/queue/export', {
    headers: { Authorization: 'Bearer ' + platformToken },
  })
  expect(wrongActor.status()).toBe(403)

  const rejectedRange = await request.get(api + '/reporting/queue', {
    headers: clinicHeaders,
    params: { fromDate: '2026-10-17', toDate: '2026-10-01' },
  })
  expect(rejectedRange.status()).toBe(400)

  const preview = await request.get(api + '/reporting/queue', { headers: clinicHeaders })
  expect(preview.status()).toBe(200)
  const json = await preview.json()
  expect(json.data.totalCount).toBe(0)
  const csv = await request.get(api + '/reporting/queue/export', { headers: clinicHeaders })
  expect(csv.status()).toBe(200)
  expect(csv.headers()['content-type']).toContain('text/csv')
  expect(await csv.text()).toContain('WorkflowStatus')

  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Enter clinic' }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await page.goto('/reports')
  await expect(page.getByRole('heading', { name: 'Clinic queue report' })).toBeVisible()
  await expect(page.getByText('0 queue entries')).toBeVisible()
  const responsePromise = page.waitForResponse(r => r.url().includes('/reporting/queue/export') && r.request().method() === 'GET')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export queue CSV' }).click()
  expect((await responsePromise).status()).toBe(200)
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^auran-queue-.*\.csv$/)
  expect(await download.failure()).toBeNull()
})
