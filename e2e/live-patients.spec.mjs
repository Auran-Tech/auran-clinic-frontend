import { expect, test } from '@playwright/test'

test('Patients list, search, edit link, and registration dialog use the live clinic API', async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_CLINIC_EMAIL || !process.env.E2E_CLINIC_PASSWORD,
    'Requires the local clinic test account',
  )

  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.E2E_CLINIC_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_CLINIC_PASSWORD)
  await page.getByRole('button', { name: 'Enter clinic' }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await expect(page.locator('.patients-table tbody tr')).toHaveCount(5)
  await expect(page.getByText('Showing 1–5 of 20')).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('Showing 6–10 of 20')).toBeVisible()
  await expect(page.locator('.patients-table tbody tr')).toHaveCount(5)

  await page.getByRole('textbox', { name: 'Search patients', exact: true }).fill('01000001001')
  await expect(page.locator('.patients-table tbody tr')).toHaveCount(1)
  await expect(page.getByText('Showing 1–1 of 1')).toBeVisible()
  await page.getByRole('link', { name: 'Edit' }).click()
  await expect(page).toHaveURL(/\/patients\/[^/]+\?edit=1$/)
  await expect(page.getByRole('button', { name: 'Cancel edit' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible()

  await page.goto('/patients')
  await page.getByRole('button', { name: 'Register patient' }).click()
  await expect(page.getByRole('dialog', { name: 'Register new patient' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  let createRequests = 0
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname.endsWith('/patients')
    ) {
      createRequests += 1
    }
  })
  await page.getByRole('button', { name: 'Register patient' }).click()
  await page.getByLabel('Full name').fill('Duplicate phone verification')
  await page.getByLabel('Phone').fill('01000001001')
  await page.getByRole('dialog').getByRole('button', { name: 'Register patient' }).click()
  await expect(page.getByRole('alert')).toContainText('already uses this phone number')
  expect(createRequests).toBe(0)
  await page.keyboard.press('Escape')

  await page.getByLabel('Account menu').click()
  await page.getByRole('button', { name: 'AR', exact: true }).click()
  await page.locator('details.topbar-account summary').click()
  await expect(page.getByRole('heading', { name: 'المرضى' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'تسجيل مريض' })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'المرضى' })).toBeVisible()
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(pageWidth).toBeLessThanOrEqual(390)
})
