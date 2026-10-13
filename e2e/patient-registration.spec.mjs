import { test, expect } from '@playwright/test'

test('authorized receptionist registers a patient in the browser', async ({ page }) => {
  const patient = {
    id: 'patient-e2e-1', patientNumber: 'P-E2E-001',
    fullName: 'Browser Test Patient', phone: '01012345678',
    createdDate: new Date().toISOString(),
  }
  const patients = []
  await page.addInitScript(() => {
    localStorage.setItem('auran.auth.session', JSON.stringify({
      accessToken: 'browser-fixture-token',
      refreshToken: 'browser-fixture-refresh',
      accessTokenExpiresDate: '2099-01-01T00:00:00Z',
      user: { userId: 'reception-1', clinicId: 'clinic-1', fullName: 'Reception',
        isSuperUser: false, roles: ['Reception'], permissions: ['Patient_View', 'Patient_Create'] },
    }))
  })
  await page.route('**/api/patients/duplicates', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ status: true, data: [] }),
  }))
  await page.route('**/api/patients**', async route => {
    const request = route.request()
    if (request.method() === 'POST') {
      const body = request.postDataJSON()
      patients.push({ ...patient, ...body })
      await route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ status: true, data: patients[0] }) })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ status: true, data: {
        data: patients, setting: { totalCount: patients.length, currentPage: 1, totalPage: 1, rowCount: 20 },
      } }) })
  })

  await page.goto('/patients')
  await expect(page.getByRole('heading', { name: 'Patients', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Add patient' }).click()
  await page.getByLabel('Full name').fill(patient.fullName)
  await page.getByLabel('Phone').fill(patient.phone)
  await page.getByRole('button', { name: 'Save patient' }).click()
  await expect(page.getByRole('link', { name: patient.fullName })).toBeVisible()
})
