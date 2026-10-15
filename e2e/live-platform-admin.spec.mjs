import { test, expect } from '@playwright/test'

const api = process.env.E2E_API_BASE_URL

test('platform browser provisions and updates clinic against real API and SQL', async ({ page, request }) => {
  test.skip(!api, 'Requires disposable hosted API + SQL')
  const email = process.env.PlatformBootstrap__Email
  const password = process.env.PlatformBootstrap__Password
  if (!email || !password) throw new Error('Missing disposable platform bootstrap credentials')

  // A clinic login is deliberately not used: Platform has its own actor scope.
  await page.goto('/platform')
  await expect(page.getByRole('heading', { name: 'Platform administration' })).toBeVisible()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Platform sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Clinics' })).toBeVisible()

  const suffix = Date.now().toString(36)
  const name = 'Platform Browser Clinic ' + suffix
  await page.getByRole('button', { name: 'Provision clinic' }).click()
  await page.getByLabel('Clinic name').fill(name)
  await page.getByLabel('Code prefix').fill('PB')
  await page.getByLabel('Time zone (IANA)').fill('Africa/Cairo')
  await page.getByLabel('Initial admin full name').fill('Browser Admin')
  await page.getByLabel('Initial admin email').fill('platform-browser-' + suffix + '@example.invalid')
  await page.getByLabel('Initial admin password').fill(password)
  const provision = page.waitForResponse(response => response.url() === api + '/platform/clinics' && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Create clinic' }).click()
  expect((await provision).status()).toBe(201)
  const clinicRow = page.getByRole('row').filter({ hasText: name })
  await expect(clinicRow).toBeVisible()

  await clinicRow.getByRole('button', { name }).click()
  await expect(page.getByText(/Clinic details —/)).toBeVisible()
  await page.getByLabel('Clinic name', { exact: true }).fill(name + ' Updated')
  const update = page.waitForResponse(response => response.url() === api + '/platform/clinics' && response.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Save changes' }).click()
  expect((await update).status()).toBe(200)
  await expect(page.getByRole('row').filter({ hasText: name + ' Updated' })).toBeVisible()

  // Platform auth must not create a clinic session usable for clinical data.
  const patients = await request.get(api + '/patients')
  expect(patients.status()).toBe(401)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('heading', { name: 'Platform administration' })).toBeVisible()
})
