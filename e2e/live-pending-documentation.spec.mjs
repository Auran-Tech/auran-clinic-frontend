import { expect, test } from '@playwright/test'

test('pending documentation filters and editor use live clinic data', async ({
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
  await page.setViewportSize({ width: 1920, height: 1080 })
  await expect(page.locator('.patients-page')).toBeVisible()
  expect(
    await page.locator('.patients-page').evaluate((element) => element.clientWidth),
  ).toBeGreaterThan(1500)
  await page.goto('/pending-documentation')
  await page.evaluate(() => document.fonts.ready)
  const desktopStyles = await page.locator('.pending-page').evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    headingSize: Number.parseFloat(
      getComputedStyle(element.querySelector('h1')).fontSize,
    ),
    font: getComputedStyle(document.body).fontFamily,
    bodySize: Number.parseFloat(getComputedStyle(document.body).fontSize),
  }))
  expect(desktopStyles.width).toBeGreaterThan(1500)
  expect(desktopStyles.headingSize).toBeLessThan(29)
  expect(desktopStyles.bodySize).toBe(14)
  expect(desktopStyles.font).toContain('Inter Variable')

  const rows = page.locator('.pending-table tbody tr')
  await expect(rows.first()).toBeVisible()
  await expect(rows.first().locator('.pending-visit-age')).toBeVisible()
  const allCount = await rows.count()
  expect(allCount).toBeGreaterThan(0)
  await expect(
    page
      .getByRole('region', { name: 'Documentation summary' })
      .locator('.auran-kpi-card'),
  ).toHaveCount(4)
  await expect(page.locator('.pending-header a')).toHaveCount(0)

  await page.route('**/api/pending-documentation?**', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    const source = body.data[0]
    await route.fulfill({
      response,
      json: {
        ...body,
        data: Array.from({ length: 7 }, (_, index) => ({
          ...source,
          visitId: `pagination-${index}`,
          patientName: `Pagination Patient ${index}`,
        })),
      },
    })
  })
  await page.reload()
  await expect(rows).toHaveCount(5)
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(rows).toHaveCount(2)
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  await page.getByRole('button', { name: 'Patient' }).click()
  await expect(rows).toHaveCount(5)
  await expect(page.getByText('Page 1 of 2')).toBeVisible()
  await page.unroute('**/api/pending-documentation?**')
  await page.reload()
  await expect(rows).toHaveCount(allCount)

  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  const filters = page.getByRole('dialog', { name: 'Filters' })
  await filters.locator('.p-dropdown').last().click()
  await page.getByRole('option', { name: 'Draft' }).click()
  await filters.getByRole('button', { name: 'Apply filters' }).click()
  await expect(rows.first()).toContainText('Draft')
  expect(await rows.count()).toBeLessThanOrEqual(allCount)
  await page
    .locator('.pending-filter-actions')
    .getByRole('button', { name: 'Clear' })
    .click()
  await expect(rows).toHaveCount(allCount)

  await rows.first().getByRole('button', { name: 'Finish note' }).click()
  const editor = page.getByRole('dialog', { name: /Finish note/ })
  await expect(editor.getByLabel('Chief complaint')).toBeVisible()
  await expect(editor.getByLabel('Clinical notes')).toBeVisible()
  await editor
    .locator('.pending-editor-actions')
    .getByRole('button', { name: 'Close' })
    .click()
  await expect(editor).toHaveCount(0)

  await page.getByLabel('Account menu').click()
  await page.getByRole('switch', { name: 'Dark mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  const lightPanel = await page
    .locator('.pending-page')
    .evaluate((element) => getComputedStyle(element).backgroundColor)
  await page.getByRole('switch', { name: 'Dark mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const darkPanel = await page
    .locator('.pending-page')
    .evaluate((element) => getComputedStyle(element).backgroundColor)
  expect(lightPanel).not.toBe(darkPanel)
  await page.getByRole('button', { name: 'AR', exact: true }).click()
  await page.locator('details.topbar-account summary').click()
  await expect(page.getByRole('heading', { name: 'التوثيق المعلّق' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  expect(
    await page.evaluate(() => getComputedStyle(document.body).fontFamily),
  ).toContain('Noto Sans Arabic Variable')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
})
