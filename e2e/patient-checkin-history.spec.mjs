import { test, expect } from '@playwright/test'

test('authorized receptionist checks in a patient and sees history', async ({ page }) => {
  let checkedIn = false
  const patientId = 'browser-patient'
  const visit = { id: 'browser-visit', patientId, doctorId: 'doctor-1',
    status: 'Open', entryAtUtc: '2026-10-13T09:00:00Z', workflowStatusName: 'Waiting' }

  await page.addInitScript(() => {
    localStorage.setItem('auran.auth.session', JSON.stringify({
      accessToken: 'test-access', refreshToken: 'test-refresh',
      accessTokenExpiresDate: '2099-01-01T00:00:00Z',
      user: { userId: 'receptionist', clinicId: 'clinic', fullName: 'Receptionist',
        isSuperUser: false, roles: [], permissions: ['Patient_View', 'Visit_View', 'Visit_Start'] },
    }))
  })
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data = []
    if (path.endsWith('/patients/detail')) data = {
      id: patientId, fullName: 'Demo Patient', patientNumber: 'P-100',
      phone: '01012345678', createdDate: '2026-10-01T09:00:00Z',
    }
    if (path.includes('/patient-profile/configuration')) data = { sections: [] }
    if (path.endsWith('/patient-profile')) data = { values: [] }
    if (path.endsWith('/patient-medical-history')) data = { conditions: [], allergies: [], medications: [] }
    if (path.endsWith('/users')) data = [
      { id: 'doctor-1', fullName: 'Demo Doctor', isActive: true, roles: ['DOCTOR'] },
    ]
    if (path.endsWith('/visits/start')) {
      expect(route.request().postDataJSON()).toEqual({ patientId, doctorId: 'doctor-1' })
      checkedIn = true
      data = visit
    }
    if (path.endsWith('/visits/active')) data = checkedIn ? visit : null
    if (path.endsWith('/visits/history')) data = {
      patientId, visits: {
        data: [{
          visitId: visit.id, doctorId: visit.doctorId, doctorName: 'Demo Doctor',
          status: visit.status, documentationStatus: 'NotStarted',
          entryAtUtc: visit.entryAtUtc, sessionCount: 0,
        }],
        setting: { currentPage: 1, totalPage: 1, totalCount: 1, rowCount: 10 },
      },
    }
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ status: true, data }) })
  })

  await page.goto('/patients/' + patientId)
  await expect(page.getByRole('heading', { name: 'Demo Patient' })).toBeVisible()
  await page.getByLabel('Doctor').selectOption('doctor-1')
  const checkInResponse = page.waitForResponse(response => response.url().endsWith('/visits/start') && response.status() === 200)
  await page.getByRole('button', { name: 'Check in patient' }).click()
  await checkInResponse
  await page.reload()
  await expect(page.getByText('Active visit', { exact: true })).toBeVisible()
  await expect(page.locator('.visit-history-card')).toHaveCount(1)
})
