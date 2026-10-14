import './live-clinical-journey.spec.mjs'
import { test, expect } from '@playwright/test'

const backend = process.env.E2E_API_BASE_URL

test('real frontend browser can reach hosted API and SQL readiness', async ({ page, request }) => {
  test.skip(!backend, 'Requires a running backend: E2E_API_BASE_URL')
  const apiRoot = backend.replace(/\/api\/?$/, '')

  const live = await request.get(apiRoot + '/health/live')
  expect(live.status()).toBe(200)

  const ready = await request.get(apiRoot + '/health/ready')
  expect(ready.status()).toBe(200)

  const protectedResponse = await request.get(backend + '/patients')
  expect(protectedResponse.status()).toBe(401)

  await page.goto('/login')
  const browserResult = await page.evaluate(async (apiBase) => {
    try {
      const response = await fetch(apiBase + '/patients')
      return { status: response.status, corsAccessible: true }
    } catch (error) {
      return { corsAccessible: false, message: String(error) }
    }
  }, backend)
  expect(browserResult).toEqual({ status: 401, corsAccessible: true })

  await page.goto('/patients')
  await expect(page).toHaveURL('http://127.0.0.1:4173/login')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})
