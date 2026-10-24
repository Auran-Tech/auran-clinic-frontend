import { expect } from '@playwright/test'
import {
  authenticatedHeaders,
  matchesApiResponse,
} from './live-clinical-flow.helpers.mjs'

export async function verifyClinicalDocumentation(page, request, api, token, visit) {
  const start = page.waitForResponse((response) =>
    matchesApiResponse(response, '/clinical-sessions/start', 'POST'),
  )
  await page.getByRole('button', { name: 'Start clinical session' }).click()
  expect((await start).status()).toBe(201)
  await expect(page.getByLabel('Chief complaint')).toBeVisible()
  await page.getByLabel('Chief complaint').fill('Routine consultation')
  await page.getByLabel('Examination').fill('Examination recorded')
  await page
    .getByLabel('Clinical notes')
    .fill('Documented by authorized clinic test actor')
  const saving = page.waitForResponse((response) =>
    matchesApiResponse(response, '/clinical-sessions/documentation', 'PUT'),
  )
  await page.getByRole('button', { name: 'Save draft' }).click()
  const saved = await saving
  expect(saved.status()).toBe(200)
  expect((await saved.json()).data.chiefComplaint).toBe('Routine consultation')
  const ending = page.waitForResponse((response) =>
    matchesApiResponse(response, '/clinical-sessions/end', 'PUT'),
  )
  await page.getByRole('button', { name: 'End session' }).click()
  const ended = await ending
  expect(ended.status()).toBe(200)
  expect((await ended.json()).data.documentationStatus).toBe('Pending')
  await page.getByLabel('Recommendation').fill('Return for a routine review')
  await page.getByLabel('Or after days').fill('7')
  const creating = page.waitForResponse((response) =>
    matchesApiResponse(response, '/follow-ups', 'POST'),
  )
  await page.getByRole('button', { name: 'Schedule follow-up' }).click()
  const created = await creating
  expect(created.status()).toBe(201)
  const followUp = (await created.json()).data
  expect(followUp.visitId).toBe(visit.id)
  const list = await request.get(api + '/follow-ups?bucket=All', {
    headers: authenticatedHeaders(token),
  })
  expect(list.status()).toBe(200)
  expect((await list.json()).data.some((item) => item.id === followUp.id)).toBe(true)
  await page.goto('/follow-ups')
  await page.getByRole('button', { name: 'Upcoming' }).click()
  const followUpRow = page
    .getByRole('row')
    .filter({ hasText: 'Return for a routine review' })
  await expect(followUpRow).toBeVisible()
  const completing = page.waitForResponse((response) =>
    matchesApiResponse(response, '/follow-ups/complete', 'PUT'),
  )
  await followUpRow.getByRole('button', { name: 'Complete' }).click()
  expect((await completing).status()).toBe(200)
  await page.getByRole('button', { name: 'Completed' }).click()
  await expect(
    page.getByRole('row').filter({ hasText: 'Return for a routine review' }),
  ).toBeVisible()
}
