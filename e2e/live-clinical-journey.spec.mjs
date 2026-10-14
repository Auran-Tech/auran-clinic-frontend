import { test } from '@playwright/test'
import { runClinicalJourney } from './live-clinical-journey.helpers.mjs'

test('real doctor check-in and queue exit', async ({ page, request }) => {
  test.skip(!process.env.E2E_API_BASE_URL, 'Requires live API and SQL Server')
  await runClinicalJourney(page, request)
})
