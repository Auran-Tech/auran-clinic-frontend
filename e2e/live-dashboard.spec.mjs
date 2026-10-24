import { expect, test } from '@playwright/test'

const email = process.env.E2E_CLINIC_EMAIL
const password = process.env.E2E_CLINIC_PASSWORD

test('dashboard matches prototype sections using real clinic data in both languages', async ({
  page,
}) => {
  test.skip(!email || !password, 'Requires a local clinic test account')

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Enter clinic' }).click()
  await expect(page).toHaveURL(/\/patients$/)

  const summaryRequest = page.waitForResponse((response) =>
    response.url().includes('/api/reporting/dashboard'),
  )
  await page.goto('/dashboard')
  const summaryResponse = await summaryRequest
  expect(summaryResponse.status()).toBe(200)
  const summary = (await summaryResponse.json()).data
  expect(summary.weeklyVisits).toHaveLength(7)

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('Visit completion')).toBeVisible()
  await expect(page.getByText('Time in flow')).toBeVisible()
  await expect(page.getByText('Pending documentation').first()).toBeVisible()
  await expect(page.getByText('Follow-ups today')).toBeVisible()
  await expect(page.getByRole('img', { name: /last seven local days/i })).toBeVisible()
  await expect(page.locator('.dashboard-trend-point')).toHaveCount(7)
  await expect(page.getByRole('heading', { name: 'Live activity' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Queue distribution' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Doctor workload' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Needs attention' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Quick actions' })).toBeVisible()

  await page.getByLabel('Account menu').click()
  await page.getByRole('button', { name: 'AR', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('heading', { name: 'نظرة عامة' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'الزيارات خلال الأسبوع' })).toBeVisible()
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true)
})
