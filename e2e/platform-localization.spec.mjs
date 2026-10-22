import { expect, test } from '@playwright/test'

test('platform login switches to Arabic and back', async ({ page }) => {
  await page.goto('/platform')
  await expect(page.getByRole('heading', { name: 'Platform administration' })).toBeVisible()

  await page.getByRole('button', { name: 'التبديل إلى العربية' }).click()
  await expect(page.getByRole('heading', { name: 'إدارة المنصة' })).toBeVisible()
  await expect(page.getByLabel('البريد الإلكتروني')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  await page.getByRole('button', { name: 'Switch to English' }).click()
  await expect(page.getByRole('heading', { name: 'Platform administration' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
})
