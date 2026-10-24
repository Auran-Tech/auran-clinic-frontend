import { verifyClinicalDocumentation } from './live-clinical-documentation.helpers.mjs'
import { expect } from '@playwright/test'
import { finalizePendingVisit } from './live-pending-documentation.helpers.mjs'
import {
  authenticatedHeaders,
  configureQueue,
  createDoctor,
  matchesApiResponse,
} from './live-clinical-flow.helpers.mjs'

export async function runClinicalJourney(page, request) {
  const api = process.env.E2E_API_BASE_URL
  const email = process.env.PlatformBootstrap__Email
  const password = process.env.PlatformBootstrap__Password
  if (!email || !password) throw new Error('Missing isolated CI platform fixture')
  const login = await request.post(api + '/platform/auth/login', {
    data: { email, password },
  })
  expect(login.status()).toBe(200)
  const platformToken = (await login.json()).data.accessToken
  const id = Date.now().toString(36)
  const admin = {
    fullName: 'Workflow Admin',
    email: 'workflow-' + id + '@example.invalid',
    password,
  }
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
  const doctorId = await createDoctor(
    request,
    api,
    clinicToken,
    'doctor-' + id + '@example.invalid',
    password,
  )
  const doctorsResponse = await request.get(api + '/visits/doctors', {
    headers: authenticatedHeaders(clinicToken),
  })
  expect(doctorsResponse.status()).toBe(200)
  const doctor = (await doctorsResponse.json()).data.find((item) => item.id === doctorId)
  expect(doctor).toBeTruthy()
  const otherDoctorEmail = 'other-doctor-' + id + '@example.invalid'
  await createDoctor(
    request,
    api,
    clinicToken,
    otherDoctorEmail,
    password,
    'Other Integration Doctor',
  )
  const otherDoctorLogin = await request.post(api + '/auth/login', {
    data: { email: otherDoctorEmail, password },
  })
  expect(otherDoctorLogin.status()).toBe(200)
  const otherDoctorToken = (await otherDoctorLogin.json()).data.accessToken
  const patientResponse = await request.post(api + '/patients', {
    headers: authenticatedHeaders(clinicToken),
    data: {
      fullName: 'Workflow Patient ' + id,
      phone: '012' + String(Date.now()).slice(-8),
    },
  })
  expect(patientResponse.status()).toBe(201)
  const patient = (await patientResponse.json()).data
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Enter clinic' }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await page.goto('/patients/' + patient.id)
  await expect(page.getByRole('heading', { name: patient.fullName })).toBeVisible()
  await page.locator('.checkin-form .p-dropdown').click()
  await page.getByRole('option', { name: doctor.fullName, exact: true }).click()
  const startResponse = page.waitForResponse((response) =>
    matchesApiResponse(response, '/visits/start', 'POST'),
  )
  await page.getByRole('button', { name: 'Check in patient' }).click()
  const started = await startResponse
  expect(started.status()).toBe(201)
  const visit = (await started.json()).data
  expect(visit.workflowStatusId).toBe(waiting.id)
  await verifyClinicalDocumentation(page, request, api, clinicToken, visit)
  await page.goto('/queue')
  await page.getByRole('button', { name: 'List' }).click()
  const row = page.getByRole('row').filter({ hasText: patient.fullName })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Move', exact: true }).click()
  await row.locator('.p-dropdown').click()
  await page.getByRole('option', { name: exited.name }).click()
  const moveResponse = page.waitForResponse((response) =>
    matchesApiResponse(response, '/queue/move', 'PUT'),
  )
  await row.getByRole('button', { name: 'Confirm move' }).click()
  const moved = await moveResponse
  expect(moved.status()).toBe(200)
  await expect(row).toContainText('Exited')
  await expect(row.getByRole('button', { name: 'Move', exact: true })).toHaveCount(0)
  await finalizePendingVisit(
    page,
    request,
    api,
    clinicToken,
    patient.fullName,
    visit.id,
    otherDoctorToken,
  )
  const history = await request.get(api + '/visits/history?patientId=' + patient.id, {
    headers: authenticatedHeaders(clinicToken),
  })
  expect(history.status()).toBe(200)
  expect(
    (await history.json()).data.visits.data.some((item) => item.visitId === visit.id),
  ).toBe(true)
}
