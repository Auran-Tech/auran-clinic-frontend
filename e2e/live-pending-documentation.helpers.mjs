import { expect } from '@playwright/test'
import {
  authenticatedHeaders,
  matchesApiResponse,
} from './live-clinical-flow.helpers.mjs'

export async function finalizePendingVisit(
  page,
  request,
  api,
  token,
  patientName,
  visitId,
  otherDoctorToken,
) {
  const headers = authenticatedHeaders(token)
  const before = await request.get(api + '/pending-documentation?mineOnly=false', {
    headers,
  })
  expect(before.status()).toBe(200)
  const pending = (await before.json()).data.find((item) => item.visitId === visitId)
  expect(pending).toBeTruthy()
  expect(pending.documentationStatus).toBe('Pending')

  // A normal doctor must not see another doctor's notes even with mineOnly=false.
  const otherDoctorList = await request.get(
    api + '/pending-documentation?mineOnly=false',
    {
      headers: authenticatedHeaders(otherDoctorToken),
    },
  )
  expect(otherDoctorList.status()).toBe(200)
  expect(
    (await otherDoctorList.json()).data.some((item) => item.visitId === visitId),
  ).toBe(false)

  await page.goto('/pending-documentation')
  const row = page.getByRole('row').filter({ hasText: patientName })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Finish note' }).click()
  const completing = page.waitForResponse((response) =>
    matchesApiResponse(response, '/pending-documentation/complete', 'PUT'),
  )
  await page.getByRole('button', { name: 'Complete documentation' }).click()
  const finished = await completing
  expect(finished.status()).toBe(200)
  expect((await finished.json()).data.documentationStatus).toBe('Completed')
  await expect(row).toHaveCount(0)

  const after = await request.get(api + '/pending-documentation?mineOnly=false', {
    headers,
  })
  expect(after.status()).toBe(200)
  expect((await after.json()).data.some((item) => item.visitId === visitId)).toBe(false)
}
