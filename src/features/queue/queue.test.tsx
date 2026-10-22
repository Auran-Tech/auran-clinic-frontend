// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueuePage } from './QueuePage'
import '../../i18n'

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  getActiveQueue: vi.fn(),
  getQueueTransitions: vi.fn(),
  moveQueueEntry: vi.fn(),
  getWorkflowConfiguration: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ hasPermission: (permission: string) => mocks.permissions.has(permission) }) }))
vi.mock('./api', () => ({ getActiveQueue: mocks.getActiveQueue, getQueueTransitions: mocks.getQueueTransitions, moveQueueEntry: mocks.moveQueueEntry }))
vi.mock('../workflow/api', () => ({ getWorkflowConfiguration: mocks.getWorkflowConfiguration }))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter><QueuePage /></MemoryRouter></QueryClientProvider>)
}

describe('QueuePage', () => {
  afterEach(() => cleanup())
  beforeEach(() => {
    mocks.permissions.clear()
    mocks.getActiveQueue.mockReset()
    mocks.getQueueTransitions.mockReset()
    mocks.moveQueueEntry.mockReset()
    mocks.getWorkflowConfiguration.mockReset()
    mocks.getWorkflowConfiguration.mockResolvedValue({ statuses: [], transitions: [] })
    mocks.getActiveQueue.mockResolvedValue([
      { queueEntryId: 'one', patientId: 'p1', patientName: 'Demo One', patientNumber: 'PT-1', doctorId: 'd1', doctorName: 'Dr. Ada', workflowStatusId: 'waiting', workflowStatusName: 'Waiting', workflowStatusColor: '#f59e0b', entryAtUtc: new Date().toISOString() },
      { queueEntryId: 'two', patientId: 'p2', patientName: 'Demo Two', patientNumber: 'PT-2', doctorId: 'd2', doctorName: 'Dr. Omar', workflowStatusId: 'ready', workflowStatusName: 'Ready', workflowStatusColor: '#14b8a6', entryAtUtc: new Date().toISOString() },
    ])
    mocks.getQueueTransitions.mockResolvedValue([])
  })

  it('does not load the queue without Queue_View', () => {
    renderPage()
    expect(screen.getByRole('alert').textContent).toContain('do not have permission')
    expect(mocks.getActiveQueue).not.toHaveBeenCalled()
  })

  it('groups real entries into stages and filters by doctor', async () => {
    mocks.permissions.add('Queue_View')
    renderPage()
    expect(await screen.findByText('Demo One')).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Waiting' })).getByText('Demo One')).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Ready' })).getByText('Demo Two')).toBeTruthy()
    fireEvent.change(screen.getByRole('combobox', { name: 'Doctor' }), { target: { value: 'd1' } })
    expect(screen.getByText('Demo One')).toBeTruthy()
    expect(screen.queryByText('Demo Two')).toBeNull()
  })

  it('offers a list view with the existing workflow control', async () => {
    mocks.permissions.add('Queue_View')
    mocks.permissions.add('Queue_Move')
    renderPage()
    expect(await screen.findByText('Demo One')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    expect(screen.getByRole('row', { name: /Demo One/ })).toBeTruthy()
    expect(screen.getAllByRole('combobox', { name: 'Move to…' })).toHaveLength(2)
  })

  it('shows configured empty stages when the user can read workflow settings', async () => {
    mocks.permissions.add('Queue_View')
    mocks.permissions.add('Settings_View')
    mocks.getWorkflowConfiguration.mockResolvedValue({ statuses: [{ id: 'ready', name: 'Ready', color: '#14b8a6', sortOrder: 1 }, { id: 'waiting', name: 'Waiting', color: '#f59e0b', sortOrder: 0 }, { id: 'done', name: 'Completed', color: '#64748b', sortOrder: 2 }], transitions: [] })
    renderPage()
    expect(await screen.findByRole('region', { name: 'Completed' })).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Completed' })).queryByText('Demo One')).toBeNull()
  })
})
