import { expect, test } from '@playwright/test'

const backend = process.env.E2E_API_BASE_URL
const email = process.env.E2E_CLINIC_EMAIL
const password = process.env.E2E_CLINIC_PASSWORD
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+XubcAAAAASUVORK5CYII=',
  'base64',
)

test('profile settings save details, photo and preferences through the real API', async ({
  page,
}) => {
  test.skip(
    !backend || !email || !password,
    'Requires local development API and clinic account',
  )

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Enter clinic' }).click()
  await expect(page).toHaveURL(/\/patients$/)

  await page.getByLabel('Account menu').click()
  await page.getByRole('link', { name: 'Profile settings' }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Change photo' })).toBeVisible()
  await expect(page.locator('.topbar-account')).not.toHaveAttribute('open')

  await page.getByRole('combobox', { name: 'Language' }).selectOption('ar')
  await page.getByRole('combobox', { name: 'Theme' }).selectOption('light')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'profile.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await page.getByRole('button', { name: 'Save', exact: true }).click()

  await expect(
    page.getByRole('status').filter({ hasText: 'تم حفظ الملف الشخصي' }),
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('.profile-avatar img')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'إعدادات الملف الشخصي' })).toBeVisible()
  await expect(page.locator('.profile-avatar img')).toBeVisible()

  await page.getByRole('combobox', { name: 'اللغة' }).selectOption('en')
  await page.getByRole('combobox', { name: 'المظهر' }).selectOption('dark')
  await page.getByRole('button', { name: 'حفظ', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('button', { name: 'Manage' }).click()
  await expect(page.getByRole('dialog', { name: 'Active sessions' })).toBeVisible()
  await expect(page.getByText('Current session')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Change', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Change password' })).toBeVisible()
  await expect(page.getByLabel('Current password')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).last().click()

  const accessToken = await page.evaluate(() => {
    const session = localStorage.getItem('auran.auth.session')
    return session ? JSON.parse(session).accessToken : null
  })
  expect(accessToken).toBeTruthy()
  const deleted = await page.request.delete(`${backend}/users/me/photo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  expect(deleted.status()).toBe(200)

  await page.getByRole('button', { name: 'Manage' }).click()
  const currentSession = page.locator('.profile-session').filter({
    hasText: 'Current session',
  })
  await currentSession.getByRole('button', { name: 'Revoke' }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test('changing a password from the profile signs out every session', async ({
  page,
  request,
}) => {
  test.skip(
    !backend || !email || !password,
    'Requires local development API and clinic account',
  )

  const adminLogin = await request.post(`${backend}/auth/login`, {
    data: { email, password },
  })
  expect(adminLogin.status()).toBe(200)
  const adminToken = (await adminLogin.json()).data.accessToken
  const accountEmail = `profile-test-${Date.now()}@example.invalid`
  const oldPassword = 'ProfileTestPass1!'
  const newPassword = 'ProfileNewPass2!'
  const adminHeaders = { Authorization: `Bearer ${adminToken}` }
  const created = await request.post(`${backend}/users`, {
    headers: adminHeaders,
    data: {
      fullName: 'Profile Test User',
      email: accountEmail,
      password: oldPassword,
      isSuperUser: false,
      roles: ['RECEPTIONIST'],
    },
  })
  expect(created.status()).toBe(201)
  const userId = (await created.json()).data.id

  try {
    await page.goto('/login')
    await page.getByLabel('Email').fill(accountEmail)
    await page.getByLabel('Password').fill(oldPassword)
    await page.getByRole('button', { name: 'Enter clinic' }).click()
    await expect(page).toHaveURL(/\/patients$/)

    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible()
    await page.getByRole('button', { name: 'Change', exact: true }).click()
    await page.getByLabel('Current password').fill(oldPassword)
    await page.getByLabel('New password').fill(newPassword)
    await page.getByLabel('Confirm password').fill(newPassword)
    await page.getByRole('button', { name: 'Change password' }).click()
    await expect(page).toHaveURL(/\/login$/)

    const oldLogin = await request.post(`${backend}/auth/login`, {
      data: { email: accountEmail, password: oldPassword },
    })
    expect(oldLogin.status()).toBe(401)

    await page.getByLabel('Email').fill(accountEmail)
    await page.getByLabel('Password').fill(newPassword)
    await page.getByRole('button', { name: 'Enter clinic' }).click()
    await expect(page).toHaveURL(/\/patients$/)
  } finally {
    await request.put(`${backend}/users/status`, {
      headers: adminHeaders,
      data: { userId, isActive: false },
    })
  }
})

test('revoke all sessions signs out a user across devices', async ({ page, request }) => {
  test.skip(
    !backend || !email || !password,
    'Requires local development API and clinic account',
  )

  const adminLogin = await request.post(`${backend}/auth/login`, {
    data: { email, password },
  })
  expect(adminLogin.status()).toBe(200)
  const adminToken = (await adminLogin.json()).data.accessToken
  const adminHeaders = { Authorization: `Bearer ${adminToken}` }
  const accountEmail = `sessions-test-${Date.now()}@example.invalid`
  const accountPassword = 'SessionsTestPass1!'
  const created = await request.post(`${backend}/users`, {
    headers: adminHeaders,
    data: {
      fullName: 'Sessions Test User',
      email: accountEmail,
      password: accountPassword,
      isSuperUser: false,
      roles: ['RECEPTIONIST'],
    },
  })
  expect(created.status()).toBe(201)
  const userId = (await created.json()).data.id

  try {
    await page.goto('/login')
    await page.getByLabel('Email').fill(accountEmail)
    await page.getByLabel('Password').fill(accountPassword)
    await page.getByRole('button', { name: 'Enter clinic' }).click()
    await expect(page).toHaveURL(/\/patients$/)

    const secondLogin = await request.post(`${backend}/auth/login`, {
      data: { email: accountEmail, password: accountPassword },
    })
    expect(secondLogin.status()).toBe(200)
    const secondToken = (await secondLogin.json()).data.accessToken

    await page.goto('/profile')
    await page.getByRole('button', { name: 'Manage' }).click()
    const dialog = page.getByRole('dialog', { name: 'Active sessions' })
    await expect(dialog.getByText('2 active sessions')).toBeVisible()
    await expect(dialog.locator('.profile-session')).toHaveCount(2)
    await expect(dialog.getByText('Current session')).toBeVisible()
    const signInDate = dialog.getByText(/^Signed in:/).first()
    await expect(signInDate).toBeVisible()
    await expect(signInDate).not.toContainText('Date unavailable')

    await dialog.getByRole('button', { name: 'Revoke all sessions' }).click()
    await expect(dialog.getByText('Revoke every session?')).toBeVisible()
    await dialog.getByRole('button', { name: 'Revoke all and sign out' }).click()
    await expect(page).toHaveURL(/\/login$/)

    const rejected = await request.get(`${backend}/users/me`, {
      headers: { Authorization: `Bearer ${secondToken}` },
    })
    expect(rejected.status()).toBe(401)
  } finally {
    await request.put(`${backend}/users/status`, {
      headers: adminHeaders,
      data: { userId, isActive: false },
    })
  }
})
