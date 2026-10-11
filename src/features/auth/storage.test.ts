// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { clearSession, readSession, writeSession } from './storage'
import type { AuthSession } from './types'

const session: AuthSession = {
  accessToken: 'access',
  refreshToken: 'refresh',
  accessTokenExpiresDate: '2026-10-07T00:00:00Z',
  user: {
    userId: '00000000-0000-0000-0000-000000000001',
    clinicId: '00000000-0000-0000-0000-000000000002',
    fullName: 'Test User',
    email: 'test@example.com',
    isSuperUser: false,
    roles: ['RECEPTIONIST'],
    permissions: ['Patient_View'],
  },
}

describe('auth storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists and reads a session', () => {
    writeSession(session)
    expect(readSession()).toEqual(session)
  })

  it('clears the persisted session', () => {
    writeSession(session)
    clearSession()
    expect(readSession()).toBeNull()
  })

  it('removes invalid stored JSON', () => {
    localStorage.setItem('auran.auth.session', '{broken')
    expect(readSession()).toBeNull()
  })
})
