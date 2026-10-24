import { expect, test } from '@playwright/test'

test('live queue board fits its lanes and shows permitted transitions', async ({
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
  await page.goto('/queue')
  await expect(page.getByRole('heading', { name: 'Live queue' })).toBeVisible()
  await expect(page.locator('.queue-board-card').first()).toBeVisible()

  const overflowCards = await page.locator('.queue-board-card').evaluateAll(
    (cards) =>
      cards.filter((card) => {
        const cardBounds = card.getBoundingClientRect()
        const laneBounds = card.closest('.queue-lane').getBoundingClientRect()
        return cardBounds.left < laneBounds.left || cardBounds.right > laneBounds.right
      }).length,
  )
  expect(overflowCards).toBe(0)

  const allCards = await page.locator('.queue-board-card').count()
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  const filters = page.getByRole('dialog', { name: 'Filters' })
  await filters.locator('.p-dropdown').nth(1).click()
  await page
    .locator('.p-dropdown-panel .p-dropdown-item')
    .filter({ hasText: 'Demo Doctor 01' })
    .click()
  await filters.getByRole('button', { name: 'Apply filters' }).click()
  const filteredCards = await page.locator('.queue-board-card').count()
  expect(filteredCards).toBeGreaterThan(0)
  expect(filteredCards).toBeLessThan(allCards)

  await page.locator('.queue-toolbar').getByRole('button', { name: 'Clear' }).click()
  await expect(page.locator('.queue-board-card')).toHaveCount(allCards)

  await page.getByRole('button', { name: 'List' }).click()
  await page.getByRole('button', { name: 'Patient', exact: true }).click()
  const sortedResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname.endsWith('/queue') &&
      url.searchParams.get('sortBy') === 'patientName' &&
      url.searchParams.get('descending') === 'true' &&
      response.status() === 200
    )
  })
  await page.getByRole('button', { name: 'Patient', exact: true }).click()
  await sortedResponse

  await expect(page.locator('.queue-list tbody tr').first()).toBeVisible()
  const transitionResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/queue/transitions') && response.status() === 200,
  )
  await page.getByRole('button', { name: 'Move', exact: true }).first().click()
  await transitionResponse
  await expect(page.locator('.queue-action-menu')).toHaveCount(1)
  const doctorsResponse = page.waitForResponse(
    (response) => response.url().includes('/visits/doctors') && response.status() === 200,
  )
  await page.getByRole('button', { name: 'Register arrival' }).click()
  await doctorsResponse
  const arrival = page.getByRole('dialog', { name: 'Register arrival' })
  await expect(arrival.getByRole('textbox', { name: /Doctor/ })).toBeEnabled()
  await expect(arrival.getByRole('textbox', { name: /Patient/ })).toBeEnabled()
  await expect(arrival.getByRole('button', { name: 'Register arrival' })).toBeDisabled()
  await arrival.getByRole('button', { name: 'Cancel' }).click()

  await page.getByLabel('Account menu').click()
  await page.getByRole('button', { name: 'AR', exact: true }).click()
  await page.locator('details.topbar-account summary').click()
  await expect(
    page.getByRole('heading', { name: 'قائمة الانتظار المباشرة' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'لوحة' }).click()
  await expect(page.getByRole('region', { name: 'في الانتظار' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'مكتمل' })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(pageWidth).toBeLessThanOrEqual(390)
})

test('dragging a queue card sends only a configured transition', async ({ page }) => {
  test.skip(
    !process.env.E2E_CLINIC_EMAIL || !process.env.E2E_CLINIC_PASSWORD,
    'Requires the local clinic test account',
  )

  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.E2E_CLINIC_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_CLINIC_PASSWORD)
  await page.getByRole('button', { name: 'Enter clinic' }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await page.goto('/queue')
  const source = page
    .getByRole('region', { name: 'Waiting' })
    .locator('.queue-board-card')
    .first()
  await expect(source).toBeVisible()

  const transitionsResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/queue/transitions') && response.status() === 200,
  )
  await source.getByRole('button', { name: 'Move', exact: true }).click()
  const transitions = (await (await transitionsResponse).json()).data
  const target = transitions.find((option) => !option.isSystemFinal)
  expect(target).toBeTruthy()
  await source.getByRole('button', { name: 'Move', exact: true }).click()

  let moveRequest
  await page.route('**/api/queue/move', async (route) => {
    moveRequest = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: true,
        data: { queueEntryId: moveRequest.queueEntryId },
      }),
    })
  })

  await source.dragTo(page.getByRole('region', { name: target.name }))
  await expect.poll(() => moveRequest?.toWorkflowStatusId).toBe(target.workflowStatusId)
})
