import { test, expect } from '@playwright/test'

test('anonymous patients route redirects to login', async ({ page }) => {
  await page.goto('/patients')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})

test('login form does not navigate without valid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Enter clinic' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})
