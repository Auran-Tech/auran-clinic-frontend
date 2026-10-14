import { test, expect } from '@playwright/test'

const backend = process.env.E2E_API_BASE_URL

test('live backend rejects invalid login from real browser form', async ({ page }) => {
  test.skip(!backend, 'Requires running backend in combined-stack CI')

  await page.goto('/login')
  await page.getByLabel('Email').fill('not-a-user@example.invalid')
  await page.getByLabel('Password').fill('Incorrect_Password_123!')

  const loginResponse = page.waitForResponse(response =>
    response.url() === backend + '/auth/login' &&
    response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Sign in' }).click()
  const response = await loginResponse

  expect(response.status()).toBe(401)
  await expect(page.getByText('Invalid credentials or inactive clinic account.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})
