import { expect, test } from '@playwright/test'

test('healthy readiness opens the existing login screen', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})

test('branded startup remains until readiness finishes', async ({ page }) => {
  let finishReadiness
  await page.route('**/health/ready', async route => {
    await new Promise(resolve => { finishReadiness = resolve })
    await route.fulfill({ status: 200, body: 'Healthy', headers: { 'access-control-allow-origin': '*' } })
  })
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Preparing your clinic workspace' })).toBeVisible()
  await expect.poll(() => Boolean(finishReadiness)).toBe(true)
  finishReadiness()
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})

test('failed readiness retries, shows disconnected, and recovers manually', async ({ page }) => {
  let ready = false
  await page.route('**/health/ready', route => route.fulfill({ status: ready ? 200 : 503, body: ready ? 'Healthy' : 'Unavailable', headers: { 'access-control-allow-origin': '*' } }))

  await page.goto('/login')
  await expect(page.locator('.connection-retry-layer')).toContainText('Retrying Connection')
  await expect(page.getByRole('alertdialog')).toContainText('Disconnected', { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toHaveCount(0)

  ready = true
  await page.getByRole('button', { name: 'Try connecting now' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})

test('an automatic retry restores the screen when health returns', async ({ page }) => {
  let checks = 0
  await page.route('**/health/ready', route => {
    checks += 1
    return route.fulfill({ status: checks === 1 ? 503 : 200, body: checks === 1 ? 'Unavailable' : 'Healthy', headers: { 'access-control-allow-origin': '*' } })
  })

  await page.goto('/login')
  await expect(page.locator('.connection-retry-layer')).toContainText('Retrying Connection')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible({ timeout: 10_000 })
  expect(checks).toBeGreaterThanOrEqual(2)
})

test('an HTTP request timeout uses the same retry and recovery flow', async ({ page }) => {
  let checks = 0
  await page.route('**/health/ready', route => {
    checks += 1
    return route.fulfill({
      status: checks === 1 ? 408 : 200,
      body: checks === 1 ? 'Request Timeout' : 'Healthy',
      headers: { 'access-control-allow-origin': '*' },
    })
  })

  await page.goto('/login')
  await expect(page.locator('.connection-retry-layer')).toContainText('Retrying Connection')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible({ timeout: 10_000 })
  expect(checks).toBeGreaterThanOrEqual(2)
})

test('connection loss keeps the current form and restores it after a manual retry', async ({ page }) => {
  let ready = true
  let recovering = false
  await page.route('**/health/ready', async route => {
    if (recovering) await new Promise(resolve => setTimeout(resolve, 700))
    await route.fulfill({ status: ready ? 200 : 503, body: ready ? 'Healthy' : 'Unavailable', headers: { 'access-control-allow-origin': '*' } })
  })
  await page.goto('/login')
  await page.getByLabel('Email').fill('demo@example.invalid')

  ready = false
  await page.evaluate(() => window.dispatchEvent(new Event('auran:connection-failed')))
  await expect(page.locator('.connection-retry-layer')).toContainText('Retrying Connection')
  await expect(page.getByRole('alertdialog')).toContainText('Disconnected', { timeout: 15_000 })

  ready = true
  recovering = true
  await page.getByRole('button', { name: 'Try connecting now' }).click()
  await expect(page.locator('.connection-retry-layer')).toContainText('Connecting to Auran')
  await expect(page.getByLabel('Email')).toHaveValue('demo@example.invalid')
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})
