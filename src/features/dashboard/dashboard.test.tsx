// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'
import '../../i18n'

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  getDashboardSummary: vi.fn(),
  getActiveQueue: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    hasPermission: (permission: string) => mocks.permissions.has(permission),
    signOut: vi.fn(),
  }),
}))

vi.mock('../reporting/api', () => ({
  getDashboardSummary: mocks.getDashboardSummary,
}))
vi.mock('../queue/api', () => ({ getActiveQueue: mocks.getActiveQueue }))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter><DashboardPage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage permissions', () => {
  afterEach(() => cleanup())
  beforeEach(() => {
    mocks.permissions.clear()
    mocks.getDashboardSummary.mockReset()
    mocks.getActiveQueue.mockReset()
    mocks.getActiveQueue.mockResolvedValue([])
    mocks.getDashboardSummary.mockResolvedValue({
      localDate: '2026-10-15',
      totalPatients: 10,
      visitsToday: 3,
      activeQueue: 2,
      completedVisitsToday: 1,
      pendingDocumentation: 1,
      followUpsToday: 4,
      overdueFollowUps: 2,
    })
  })

  it('does not request clinical summary without Reports_View', () => {
    renderPage()
    expect(screen.getByRole('alert').textContent).toContain('do not have permission')
    expect(mocks.getDashboardSummary).not.toHaveBeenCalled()
  })

  it('shows only metrics backed by additional read permissions', async () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Patient_View')
    renderPage()
    expect(await screen.findByText('Total patients')).toBeTruthy()
    expect(screen.queryByText('Visits today')).toBeNull()
    expect(screen.queryByText('Active queue')).toBeNull()
    expect(screen.queryByText('Follow-ups today')).toBeNull()
  })

  it('shows the queue metric only when Queue_View is granted', async () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Queue_View')
    renderPage()
    expect(await screen.findByText('Active queue')).toBeTruthy()
    expect(screen.queryByText('Total patients')).toBeNull()
  })

  it('shows real queue stages and current arrivals when queue access is granted', async () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Queue_View')
    mocks.getActiveQueue.mockResolvedValue([{ queueEntryId: 'entry-1', patientId: 'patient-1', patientName: 'Demo Patient', patientNumber: 'PT-1', doctorId: 'doctor-1', doctorName: 'Demo Doctor', workflowStatusId: 'waiting', workflowStatusName: 'Waiting', workflowStatusColor: '#3b82f6' }])
    renderPage()
    expect(await screen.findByText('Demo Patient')).toBeTruthy()
    expect(screen.getByText('Demo Doctor')).toBeTruthy()
    expect(screen.getByText('Queue distribution')).toBeTruthy()
  })
})
