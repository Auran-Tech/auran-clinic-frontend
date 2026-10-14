import { expect } from '@playwright/test'
import { authenticatedHeaders } from './live-clinical-flow.helpers.mjs'

export async function finalizePendingVisit(page, request, api, token, patientName, visitId) {
  const headers = authenticatedHeaders(token)
  const before = await request.get(api + '/pending-documentation?mineOnly=false', { headers })
  expect(before.status()).toBe(200)
  const pending = (await before.json()).data.find(item => item.visitId === visitId)
  expect(pending).toBeTruthy()
  expect(pending.documentationStatus).toBe('Pending')

  await page.goto('/pending-documentation')
  const row = page.getByRole('row').filter({ hasText: patientName })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Finish note' }).click()
  const completing = page.waitForResponse(response =>
    response.url() === api + '/pending-documentation/complete' &&
    response.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Complete documentation' }).click()
  const finished = await completing
  expect(finished.status()).toBe(200)
  expect((await finished.json()).data.documentationStatus).toBe('Completed')
  await expect(row).toHaveCount(0)

  const after = await request.get(api + '/pending-documentation?mineOnly=false', { headers })
  expect(after.status()).toBe(200)
  expect((await after.json()).data.some(item => item.visitId === visitId)).toBe(false)
}
