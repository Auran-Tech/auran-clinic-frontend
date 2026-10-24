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
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
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
      completedVisitsStartedToday: 1,
      pendingDocumentation: 1,
      followUpsToday: 4,
      overdueFollowUps: 2,
      weeklyVisits: [
        { localDate: '2026-10-09', count: 1 },
        { localDate: '2026-10-10', count: 2 },
        { localDate: '2026-10-11', count: 0 },
        { localDate: '2026-10-12', count: 1 },
        { localDate: '2026-10-13', count: 2 },
        { localDate: '2026-10-14', count: 1 },
        { localDate: '2026-10-15', count: 3 },
      ],
    })
  })

  it('does not request clinical summary without Reports_View', () => {
    renderPage()
    expect(screen.getByRole('alert').textContent).toContain('do not have permission')
    expect(mocks.getDashboardSummary).not.toHaveBeenCalled()
  })

  it('shows visit widgets only with visit read permission', async () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Visit_View')
    renderPage()
    expect(await screen.findByText('Visit completion')).toBeTruthy()
    expect(screen.getByText('Visits during the week')).toBeTruthy()
    expect(screen.queryByText('Time in flow')).toBeNull()
    expect(screen.queryByText('Follow-ups today')).toBeNull()
    expect(mocks.getActiveQueue).not.toHaveBeenCalled()
  })

  it('uses the same visit cohort for the completion percentage', async () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Visit_View')
    mocks.getDashboardSummary.mockResolvedValueOnce({
      localDate: '2026-10-15',
      totalPatients: 10,
      visitsToday: 4,
      activeQueue: 0,
      completedVisitsToday: 5,
      completedVisitsStartedToday: 2,
      pendingDocumentation: 0,
      followUpsToday: 0,
      overdueFollowUps: 0,
      weeklyVisits: [],
    })

    renderPage()
    const card = await screen.findByRole('link', { name: /Visit completion/ })
    expect(card.textContent).toContain('50%')
    expect(card.textContent).toContain('of 4 visits started today')
    expect(card.textContent).not.toContain('125%')
  })

  it('shows the queue metric only when Queue_View is granted', async () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Queue_View')
    renderPage()
    expect(await screen.findByText('Time in flow')).toBeTruthy()
    expect(screen.queryByText('Visit completion')).toBeNull()
    expect(screen.getByText('Queue distribution')).toBeTruthy()
  })

  it('shows real queue stages and current arrivals when queue access is granted', async () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Queue_View')
    mocks.getActiveQueue.mockResolvedValue([
      {
        queueEntryId: 'entry-1',
        patientId: 'patient-1',
        patientName: 'Demo Patient',
        patientNumber: 'PT-1',
        doctorId: 'doctor-1',
        doctorName: 'Demo Doctor',
        workflowStatusId: 'waiting',
        workflowStatusName: 'Waiting',
        workflowStatusColor: '#3b82f6',
        entryAtUtc: '2026-10-15T10:00:00Z',
      },
    ])
    renderPage()
    expect(await screen.findByText(/Demo Patient/)).toBeTruthy()
    expect(screen.getByText('Demo Doctor')).toBeTruthy()
    expect(screen.getByText('Queue distribution')).toBeTruthy()
  })
})
