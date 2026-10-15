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
  refresh: vi.fn(),
  details: vi.fn(),
  update: vi.fn(),
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
  platformRefresh: mocks.refresh,
  getPlatformClinicDetails: mocks.details,
  updatePlatformClinic: mocks.update,
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
    mocks.refresh.mockReset()
    mocks.details.mockReset()
    mocks.update.mockReset()
    mocks.details.mockResolvedValue({ id: 'clinic-id', name: 'Clinic One', code: 'C1', isActive: true, timeZoneId: 'Africa/Cairo', patientNumberPrefix: 'P', phone: null, email: null, address: null, website: null, locale: 'en', initialAdminEmail: 'doctor@example.com' })
    mocks.update.mockResolvedValue({ id: 'clinic-id', name: 'Clinic Updated', code: 'C1', isActive: true, initialAdminEmail: 'doctor@example.com' })
    mocks.login.mockResolvedValue({
      accessToken: 'platform-token', refreshToken: 'platform-refresh',
      accessTokenExpiresDate: '2099-10-15', user: { platformUserId: 'id', fullName: 'Admin', email: 'admin@example.com' },
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

  it('loads and saves operational clinic metadata without modifying the generated code', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Platform sign in' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Clinic One' }))
    expect(await screen.findByText(/Clinic details — C1/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Clinic name'), { target: { value: 'Clinic Updated' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'platform-token' }),
      expect.objectContaining({ clinicId: 'clinic-id', name: 'Clinic Updated' }),
    ))
    expect(mocks.update.mock.calls[0][1]).not.toHaveProperty('code')
  })

  it('rotates an expired platform token before requesting clinic details', async () => {
    mocks.login.mockResolvedValueOnce({
      accessToken: 'old-platform-token', refreshToken: 'old-refresh',
      accessTokenExpiresDate: '2020-01-01',
      user: { platformUserId: 'id', fullName: 'Admin', email: 'admin@example.com' },
    })
    mocks.refresh.mockResolvedValueOnce({
      accessToken: 'new-platform-token', refreshToken: 'new-refresh',
      accessTokenExpiresDate: '2099-01-01',
      user: { platformUserId: 'id', fullName: 'Admin', email: 'admin@example.com' },
    })
    renderPage()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Platform sign in' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Clinic One' }))
    await waitFor(() => expect(mocks.details).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'new-platform-token' }), 'clinic-id',
    ))
    expect(mocks.refresh).toHaveBeenCalledWith('old-refresh')
  })

  it('fails closed and clears clinic list when platform refresh fails', async () => {
    mocks.login.mockResolvedValueOnce({
      accessToken: 'expired-token', refreshToken: 'expired-refresh',
      accessTokenExpiresDate: '2020-01-01',
      user: { platformUserId: 'id', fullName: 'Admin', email: 'admin@example.com' },
    })
    mocks.refresh.mockRejectedValueOnce(new Error('Revoked refresh'))
    renderPage()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Platform sign in' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Clinic One' }))
    expect(await screen.findByRole('heading', { name: 'Platform administration' })).toBeTruthy()
    expect(screen.queryByText('Clinic One')).toBeNull()
    expect(mocks.details).not.toHaveBeenCalled()
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
