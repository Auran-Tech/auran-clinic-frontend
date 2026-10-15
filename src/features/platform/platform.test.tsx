// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlatformPage } from './PlatformPage'

const mocks = vi.hoisted(() => ({
  clinicSession: null as object | null,
  login: vi.fn(),
  list: vi.fn(),
  provision: vi.fn(),
  status: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ session: mocks.clinicSession }),
}))
vi.mock('./api', () => ({
  platformLogin: mocks.login,
  listPlatformClinics: mocks.list,
  provisionPlatformClinic: mocks.provision,
  setPlatformClinicStatus: mocks.status,
  platformLogout: mocks.logout,
}))

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter><PlatformPage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Platform actor UI boundary', () => {
  beforeEach(() => {
    mocks.clinicSession = null
    mocks.login.mockReset()
    mocks.list.mockReset()
    mocks.provision.mockReset()
    mocks.status.mockReset()
    mocks.logout.mockReset()
    mocks.login.mockResolvedValue({
      accessToken: 'platform-token', refreshToken: 'platform-refresh',
      accessTokenExpiresDate: '2026-10-15', user: { platformUserId: 'id', fullName: 'Admin', email: 'admin@example.com' },
    })
    mocks.list.mockResolvedValue([{ id: 'clinic-id', name: 'Clinic One', code: 'C1', isActive: true, timeZoneId: 'Africa/Cairo' }])
    mocks.status.mockResolvedValue(undefined)
  })
  afterEach(() => cleanup())

  it('blocks platform operations while a clinic session is active', () => {
    mocks.clinicSession = { accessToken: 'clinic-token' }
    renderPage()
    expect(screen.getByRole('alert').textContent).toContain('Sign out of the clinic workspace')
    expect(mocks.login).not.toHaveBeenCalled()
    expect(mocks.list).not.toHaveBeenCalled()
  })

  it('only loads clinics after platform login and can show clinic status', async () => {
    renderPage()
    expect(mocks.list).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Platform sign in' }))
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Clinic One')).toBeTruthy()
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('does not display clinic records when login fails', async () => {
    mocks.login.mockRejectedValueOnce(new Error('Unauthorized'))
    renderPage()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Platform sign in' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(mocks.list).not.toHaveBeenCalled()
  })
})
