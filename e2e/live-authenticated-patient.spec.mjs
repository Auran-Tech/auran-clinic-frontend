import { test, expect } from '@playwright/test'

const backend = process.env.E2E_API_BASE_URL
const platformEmail = process.env.PlatformBootstrap__Email
const platformPassword = process.env.PlatformBootstrap__Password

// Provision disposable accounts through the configured Platform test account.
test('real clinic authentication and patient registration persist in SQL Server', async ({ page, request }) => {
  test.skip(!backend || !platformEmail || !platformPassword,
    'Requires hosted API, Platform credentials, and disposable SQL Server')

  const platformLogin = await request.post(`${backend}/platform/auth/login`, {
    data: { email: platformEmail, password: platformPassword },
  })
  expect(platformLogin.status(), await platformLogin.text()).toBe(200)
  const platformSession = (await platformLogin.json()).data
  expect(platformSession?.accessToken).toBeTruthy()

  const id = Date.now().toString(36)
  const clinicAdmin = {
    fullName: 'Live Stack Clinic Administrator',
    email: `clinic-${id}@example.invalid`,
    password: 'CI_Only_Clinic_123456!',
  }
  const provision = await request.post(`${backend}/platform/clinics`, {
    headers: { Authorization: `Bearer ${platformSession.accessToken}` },
    data: {
      name: `CI Patient Flow ${id}`,
      codePrefix: 'CI',
      timeZoneId: 'Africa/Cairo',
      patientNumberPrefix: 'PT',
      locale: 'en',
      admin: clinicAdmin,
    },
  })
  expect(provision.status(), await provision.text()).toBe(201)

  await page.goto('/login')
  await page.getByLabel('Email').fill(clinicAdmin.email)
  await page.getByLabel('Password').fill(clinicAdmin.password)
  await page.getByRole('button', { name: 'Enter clinic' }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible()

  const patientName = `Browser Integration Patient ${id}`
  const phone = `012${String(Date.now()).slice(-8)}`
  await page.getByRole('button', { name: 'Register patient' }).click()
  await page.getByLabel('Full name').fill(patientName)
  await page.getByLabel('Phone').fill(phone)

  const saveResponse = page.waitForResponse(response =>
    response.url() === `${backend}/patients` &&
    response.request().method() === 'POST',
  )
  await page.getByRole('dialog').getByRole('button', { name: 'Register patient' }).click()
  const created = await saveResponse
  expect(created.status(), await created.text()).toBe(201)
  const patient = (await created.json()).data
  expect(patient?.id).toBeTruthy()
  expect(patient?.patientNumber).toBeTruthy()

  // Refresh causes a real GET to the backend; the patient must still exist.
  await page.reload()
  await expect(page.getByText(patientName)).toBeVisible()

  const clinicSession = await request.post(`${backend}/auth/login`, {
    data: { email: clinicAdmin.email, password: clinicAdmin.password },
  })
  expect(clinicSession.status(), await clinicSession.text()).toBe(200)
  const accessToken = (await clinicSession.json()).data.accessToken
  const persisted = await request.get(`${backend}/patients/detail?patientId=${patient.id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  expect(persisted.status(), await persisted.text()).toBe(200)
  expect((await persisted.json()).data.fullName).toBe(patientName)

  // A separately provisioned tenant must not read another clinic's patient by ID.
  const clinicBAdmin = {
    fullName: 'Second Clinic Administrator',
    email: `clinic-b-${id}@example.invalid`,
    password: 'CI_Only_SecondClinic_123456!',
  }
  const secondProvision = await request.post(`${backend}/platform/clinics`, {
    headers: { Authorization: `Bearer ${platformSession.accessToken}` },
    data: {
      name: `CI Isolation Clinic ${id}`,
      codePrefix: 'CI',
      timeZoneId: 'Africa/Cairo',
      patientNumberPrefix: 'PT',
      locale: 'en',
      admin: clinicBAdmin,
    },
  })
  expect(secondProvision.status(), await secondProvision.text()).toBe(201)
  const secondLogin = await request.post(`${backend}/auth/login`, {
    data: { email: clinicBAdmin.email, password: clinicBAdmin.password },
  })
  expect(secondLogin.status(), await secondLogin.text()).toBe(200)
  const secondToken = (await secondLogin.json()).data.accessToken

  const crossClinicRead = await request.get(`${backend}/patients/detail?patientId=${patient.id}`, {
    headers: { Authorization: `Bearer ${secondToken}` },
  })
  expect(crossClinicRead.status()).toBe(404)
  const secondList = await request.get(`${backend}/patients?search=${encodeURIComponent(patientName)}`, {
    headers: { Authorization: `Bearer ${secondToken}` },
  })
  expect(secondList.status(), await secondList.text()).toBe(200)
  expect((await secondList.json()).data.data).toHaveLength(0)

  // The first clinic still has access to its own patient.
  const ownAfterIsolationCheck = await request.get(`${backend}/patients/detail?patientId=${patient.id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  expect(ownAfterIsolationCheck.status()).toBe(200)
})
