import { test, expect } from '@playwright/test'

const backend = process.env.E2E_API_BASE_URL

test('live backend and SQL Server are reachable from browser runner', async ({ page, request }) => {
  test.skip(!backend, 'Run with E2E_API_BASE_URL set to live backend API URL')

  const live = await request.get(backend.slice(0, -4) + '/health/live')
  expect(live.status()).toBe(200)

  const ready = await request.get(backend.slice(0, -4) + '/health/ready')
  expect(ready.status()).toBe(200)

  const protectedResponse = await request.get(backend + '/patients')
  expect(protectedResponse.status()).toBe(401)

  await page.goto('/patients')
  await expect(page).toHaveURL('http://127.0.0.1:4173/login')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})
