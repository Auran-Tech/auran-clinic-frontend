import { expect } from '@playwright/test'
import { authenticatedHeaders, configureQueue, createDoctor } from './live-clinical-flow.helpers.mjs'

export async function runClinicalJourney(page, request) {
  const api = process.env.E2E_API_BASE_URL
  const email = process.env.PlatformBootstrap__Email
  const password = process.env.PlatformBootstrap__Password
  if (!email || !password) throw new Error('Missing isolated CI platform fixture')
  const login = await request.post(api + '/platform/auth/login', { data: { email, password } })
  expect(login.status()).toBe(200)
  const platformToken = (await login.json()).data.accessToken
}
