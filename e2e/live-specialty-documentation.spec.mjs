import { test, expect } from '@playwright/test'
import { authenticatedHeaders, createDoctor } from './live-clinical-flow.helpers.mjs'

const api = process.env.E2E_API_BASE_URL

test('real clinic can configure and assign a specialty documentation policy', async ({ page, request }) => {
  test.skip(!api, 'Requires hosted API and disposable SQL Server')
  const email = process.env.PlatformBootstrap__Email
  const password = process.env.PlatformBootstrap__Password
  if (!email || !password) throw new Error('Missing CI bootstrap fixture')

  const platformLogin = await request.post(api + '/platform/auth/login', {
    data: { email, password },
  })
  expect(platformLogin.status()).toBe(200)
  const platformToken = (await platformLogin.json()).data.accessToken
  const id = Date.now().toString(36)
  const admin = {
    fullName: 'Policy Admin',
    email: 'policy-' + id + '@example.invalid',
    password,
  }
  const created = await request.post(api + '/platform/clinics', {
    headers: authenticatedHeaders(platformToken),
    data: { name: 'Policy Clinic ' + id, codePrefix: 'CI', admin },
  })
  expect(created.status()).toBe(201)

  const login = await request.post(api + '/auth/login', {
    data: { email: admin.email, password },
  })
  expect(login.status()).toBe(200)
  const clinicToken = (await login.json()).data.accessToken
  const doctorId = await createDoctor(
    request, api, clinicToken, 'policy-doctor-' + id + '@example.invalid', password,
  )

  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Specialty documentation requirements' }))
    .toBeVisible()
  await page.getByLabel('Specialty code').fill('GENERAL')
  await page.getByLabel('Chief complaint required').check()
  await page.getByLabel('Diagnosis required').check()

  const policyResponse = page.waitForResponse(response =>
    response.url() === api + '/documentation-policies' &&
    response.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Save specialty requirements' }).click()
  expect((await policyResponse).status()).toBe(200)
  await expect(page.getByText('Specialty rules saved and audited.')).toBeVisible()

  await page.getByLabel('Assign specialty to doctor').selectOption(doctorId)
  const assignmentResponse = page.waitForResponse(response =>
    response.url() === api + '/documentation-policies/doctors' &&
    response.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Assign to doctor' }).click()
  expect((await assignmentResponse).status()).toBe(200)
  await expect(page.getByText('Doctor specialty saved.')).toBeVisible()

  const readback = await request.get(
    api + '/documentation-policies?specialtyCode=GENERAL',
    { headers: authenticatedHeaders(clinicToken) },
  )
  expect(readback.status()).toBe(200)
  expect((await readback.json()).data.requiredFields.sort()).toEqual([
    'ChiefComplaint', 'Diagnosis',
  ])
})
