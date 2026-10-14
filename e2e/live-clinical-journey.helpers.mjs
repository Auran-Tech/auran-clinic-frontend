import { expect } from '@playwright/test'
import { authenticatedHeaders, configureQueue, createDoctor } from './live-clinical-flow.helpers.mjs'

export async function runClinicalJourney(page, request) {
  const api = process.env.E2E_API_BASE_URL
  const email = process.env.PlatformBootstrap__Email
  const password = process.env.PlatformBootstrap__Password
  if (!email || !password) throw new Error('Missing isolated CI platform fixture')
  const login = await request.post(api + '/platform/auth/login', { data: { email, password } })
  expect(login.status()).toBe(200)
  const platformToken = (await login.json()).data.accessToken
  const id = Date.now().toString(36)
  const admin = { fullName: 'Workflow Admin', email: 'workflow-' + id + '@example.invalid', password }
  const createdClinic = await request.post(api + '/platform/clinics', {
    headers: authenticatedHeaders(platformToken),
    data: { name: 'Workflow Clinic ' + id, codePrefix: 'CI', admin },
  })
  expect(createdClinic.status()).toBe(201)
  const clinicLogin = await request.post(api + '/auth/login', {
    data: { email: admin.email, password },
  })
  expect(clinicLogin.status()).toBe(200)
  const clinicToken = (await clinicLogin.json()).data.accessToken
  const { waiting, exited } = await configureQueue(request, api, clinicToken)
  const doctorId = await createDoctor(request, api, clinicToken, 'doctor-' + id + '@example.invalid', password)
  const patientResponse = await request.post(api + '/patients', {
    headers: authenticatedHeaders(clinicToken),
    data: { fullName: 'Workflow Patient ' + id, phone: '012' + String(Date.now()).slice(-8) },
  })
  expect(patientResponse.status()).toBe(201)
  const patient = (await patientResponse.json()).data
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await page.goto('/patients/' + patient.id)
  await expect(page.getByRole('heading', { name: patient.fullName })).toBeVisible()
  await page.getByLabel('Doctor').selectOption(doctorId)
  const startResponse = page.waitForResponse(response =>
    response.url() === api + '/visits/start' && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Check in patient' }).click()
  const started = await startResponse
  expect(started.status()).toBe(201)
  const visit = (await started.json()).data
  expect(visit.workflowStatusId).toBe(waiting.id)
  await page.goto('/queue')
  const row = page.getByRole('row').filter({ hasText: patient.fullName })
  await expect(row).toBeVisible()
  await row.getByRole('combobox').selectOption(exited.id)
}
