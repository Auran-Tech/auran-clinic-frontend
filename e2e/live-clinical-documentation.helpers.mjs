import { expect } from '@playwright/test'
import { authenticatedHeaders } from './live-clinical-flow.helpers.mjs'

export async function verifyClinicalDocumentation(page, request, api, token, visit) {
  const start = page.waitForResponse(response =>
    response.url() === api + '/clinical-sessions/start' && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Start clinical session' }).click()
  expect((await start).status()).toBe(201)
  await expect(page.getByLabel('Chief complaint')).toBeVisible()
  await page.getByLabel('Chief complaint').fill('Routine consultation')
  await page.getByLabel('Examination').fill('Examination recorded')
  await page.getByLabel('Clinical notes').fill('Documented by authorized clinic test actor')
}
