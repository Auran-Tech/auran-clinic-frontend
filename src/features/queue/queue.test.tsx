// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueuePage } from './QueuePage'
import '../../i18n'
import type { ReactNode } from 'react'

vi.mock('primereact/dialog', () => ({
  Dialog: ({
    visible,
    header,
    children,
    footer,
  }: {
    visible: boolean
    header: string
    children: ReactNode
    footer: ReactNode
  }) =>
    visible ? (
      <div role="dialog" aria-label={header}>
        {children}
        {footer}
      </div>
    ) : null,
}))

vi.mock('primereact/dropdown', () => ({
  Dropdown: ({
    value,
    options,
    onChange,
    placeholder,
    inputId,
    optionDisabled,
    ...props
  }: {
    value: string | number
    options: { label: string; value: string | number; disabled?: boolean }[]
    onChange: (event: { value: string | number }) => void
    placeholder?: string
    inputId?: string
    optionDisabled?: string
    'aria-label'?: string
  }) => (
    <select
      id={inputId}
      aria-label={props['aria-label']}
      value={value}
      onChange={(event) => onChange({ value: event.target.value })}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={optionDisabled ? option.disabled : false}
        >
          {option.label}
        </option>
      ))}
    </select>
  ),
}))

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  getActiveQueue: vi.fn(),
  getSortedQueue: vi.fn(),
  getQueueTransitions: vi.fn(),
  moveQueueEntry: vi.fn(),
  getWorkflowConfiguration: vi.fn(),
  getPatients: vi.fn(),
  getVisitDoctors: vi.fn(),
  startVisit: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    hasPermission: (permission: string) => mocks.permissions.has(permission),
  }),
}))
vi.mock('./api', () => ({
  getActiveQueue: mocks.getActiveQueue,
  getSortedQueue: mocks.getSortedQueue,
  getQueueTransitions: mocks.getQueueTransitions,
  moveQueueEntry: mocks.moveQueueEntry,
}))
vi.mock('../workflow/api', () => ({
  getWorkflowConfiguration: mocks.getWorkflowConfiguration,
}))
vi.mock('../patients/api', () => ({ getPatients: mocks.getPatients }))
vi.mock('../visits/api', () => ({
  getVisitDoctors: mocks.getVisitDoctors,
  startVisit: mocks.startVisit,
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('QueuePage', () => {
  afterEach(() => cleanup())
  beforeEach(() => {
    mocks.permissions.clear()
    mocks.getActiveQueue.mockReset()
    mocks.getSortedQueue.mockReset()
    mocks.getQueueTransitions.mockReset()
    mocks.moveQueueEntry.mockReset()
    mocks.getWorkflowConfiguration.mockReset()
    mocks.getPatients.mockReset()
    mocks.getVisitDoctors.mockReset()
    mocks.startVisit.mockReset()
    mocks.getPatients.mockResolvedValue({
      data: [
        { id: 'p1', patientNumber: 'PT-1', fullName: 'Demo One' },
        { id: 'p3', patientNumber: 'PT-3', fullName: 'Demo Three' },
      ],
    })
    mocks.getVisitDoctors.mockResolvedValue([{ id: 'd1', fullName: 'Dr. Ada' }])
    mocks.startVisit.mockResolvedValue({ id: 'visit-3' })
    mocks.getWorkflowConfiguration.mockResolvedValue({ statuses: [], transitions: [] })
    mocks.getSortedQueue.mockResolvedValue([
      {
        queueEntryId: 'one',
        patientId: 'p1',
        patientName: 'Demo One',
        patientNumber: 'PT-1',
        doctorId: 'd1',
        doctorName: 'Dr. Ada',
        workflowStatusId: 'waiting',
        workflowStatusName: 'Waiting',
        workflowStatusColor: '#f59e0b',
        entryAtUtc: new Date().toISOString(),
      },
      {
        queueEntryId: 'two',
        patientId: 'p2',
        patientName: 'Demo Two',
        patientNumber: 'PT-2',
        doctorId: 'd2',
        doctorName: 'Dr. Omar',
        workflowStatusId: 'ready',
        workflowStatusName: 'Ready',
        workflowStatusColor: '#14b8a6',
        entryAtUtc: new Date().toISOString(),
      },
    ])
    mocks.getQueueTransitions.mockResolvedValue([])
  })

  it('does not load the queue without Queue_View', () => {
    renderPage()
    expect(screen.getByRole('alert').textContent).toContain('do not have permission')
    expect(mocks.getSortedQueue).not.toHaveBeenCalled()
  })

  it('groups real entries into stages and filters by doctor', async () => {
    mocks.permissions.add('Queue_View')
    renderPage()
    expect(await screen.findByText('Demo One')).toBeTruthy()
    expect(
      within(screen.getByRole('region', { name: 'Waiting' })).getByText('Demo One'),
    ).toBeTruthy()
    expect(
      within(screen.getByRole('region', { name: 'Ready' })).getByText('Demo Two'),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Doctor' }), {
      target: { value: 'd1' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apply filters' }))
    expect(screen.getByText('Demo One')).toBeTruthy()
    expect(screen.queryByText('Demo Two')).toBeNull()
  })

  it('offers a list view with the existing workflow control', async () => {
    mocks.permissions.add('Queue_View')
    mocks.permissions.add('Queue_Move')
    mocks.getQueueTransitions.mockResolvedValue([
      {
        workflowStatusId: 'ready',
        code: 'ready',
        name: 'Ready',
        color: '#14b8a6',
        isSystemFinal: false,
      },
      {
        workflowStatusId: 'final',
        code: 'final',
        name: 'Exited',
        color: '#64748b',
        isSystemFinal: true,
      },
    ])
    renderPage()
    expect(await screen.findByText('Demo One')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    const row = screen.getByRole('row', { name: /Demo One/ })
    expect(mocks.getQueueTransitions).not.toHaveBeenCalled()
    fireEvent.click(within(row).getByRole('button', { name: 'Move' }))
    const transitionSelect = await within(row).findByRole('combobox', {
      name: 'Move to…',
    })
    fireEvent.change(transitionSelect, { target: { value: 'final' } })
    expect(
      within(row).getByText('This stage closes the queue entry and visit.'),
    ).toBeTruthy()
    expect(mocks.getQueueTransitions).toHaveBeenCalledWith('one')
  })

  it('shows recent exits while counting only active visits and sorts from headers', async () => {
    mocks.permissions.add('Queue_View')
    mocks.permissions.add('Queue_Move')
    const active = {
      queueEntryId: 'active',
      patientId: 'p1',
      patientName: 'Active Patient',
      patientNumber: 'PT-1',
      workflowStatusId: 'waiting',
      workflowStatusCode: 'WAITING',
      workflowStatusName: 'Waiting',
      workflowStatusColor: '#f59e0b',
      entryAtUtc: new Date().toISOString(),
      exitAtUtc: null,
    }
    const exited = {
      ...active,
      queueEntryId: 'exited',
      patientId: 'p2',
      patientName: 'Exited Patient',
      patientNumber: 'PT-2',
      workflowStatusId: 'done',
      workflowStatusCode: 'EXIT',
      workflowStatusName: 'Exited',
      exitAtUtc: new Date().toISOString(),
    }
    mocks.getSortedQueue.mockResolvedValue([active, exited])
    renderPage()
    const exitedLane = await screen.findByRole('region', { name: 'Exited' })
    expect(within(exitedLane).getByText('Exited Patient')).toBeTruthy()
    expect(within(exitedLane).queryByRole('button', { name: 'Move' })).toBeNull()
    expect(
      within(screen.getByText('In flow').closest('article')!).getByText('1'),
    ).toBeTruthy()
    expect(mocks.getSortedQueue).toHaveBeenCalledWith(
      { sortBy: 'stage', descending: false },
      true,
    )

    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    fireEvent.click(screen.getByRole('button', { name: 'Patient' }))
    await waitFor(() =>
      expect(mocks.getSortedQueue).toHaveBeenCalledWith(
        { sortBy: 'patientName', descending: false },
        true,
      ),
    )
  })

  it('shows configured empty stages when the user can read workflow settings', async () => {
    mocks.permissions.add('Queue_View')
    mocks.permissions.add('Settings_View')
    mocks.getWorkflowConfiguration.mockResolvedValue({
      statuses: [
        { id: 'ready', name: 'Ready', color: '#14b8a6', sortOrder: 1 },
        { id: 'waiting', name: 'Waiting', color: '#f59e0b', sortOrder: 0 },
        { id: 'done', name: 'Completed', color: '#64748b', sortOrder: 2 },
      ],
      transitions: [],
    })
    renderPage()
    expect(await screen.findByRole('region', { name: 'Completed' })).toBeTruthy()
    expect(
      within(screen.getByRole('region', { name: 'Completed' })).queryByText('Demo One'),
    ).toBeNull()
  })

  it('registers an available patient directly from the queue', async () => {
    mocks.permissions.add('Queue_View')
    mocks.permissions.add('Patient_View')
    mocks.permissions.add('Visit_Start')
    renderPage()
    expect(await screen.findByText('Demo One')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Register arrival' }))

    const dialog = screen.getByRole('dialog', { name: 'Register arrival' })
    await within(dialog).findByRole('option', { name: 'PT-3 — Demo Three' })
    expect(
      (
        within(dialog).getByRole('option', {
          name: /PT-1 — Demo One.*Already in queue/,
        }) as HTMLOptionElement
      ).disabled,
    ).toBe(true)
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Patient' }), {
      target: { value: 'p3' },
    })
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Doctor' }), {
      target: { value: 'd1' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Register arrival' }))
    await waitFor(() => expect(mocks.startVisit).toHaveBeenCalled())
    expect(mocks.startVisit.mock.calls[0][0]).toEqual({ patientId: 'p3', doctorId: 'd1' })
  })

  it('moves a dragged card only to a configured next stage', async () => {
    mocks.permissions.add('Queue_View')
    mocks.permissions.add('Queue_Move')
    mocks.getQueueTransitions.mockResolvedValue([
      {
        workflowStatusId: 'ready',
        code: 'READY',
        name: 'Ready',
        color: '#14b8a6',
        isSystemFinal: false,
      },
    ])
    mocks.moveQueueEntry.mockResolvedValue({ queueEntryId: 'one' })
    renderPage()
    await screen.findByText('Demo One')
    const card = screen.getByText('Demo One').closest('.queue-board-card')!
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      getData: () => 'one',
    }
    fireEvent.dragStart(card, { dataTransfer })
    fireEvent.dragOver(screen.getByRole('region', { name: 'Ready' }), { dataTransfer })
    fireEvent.drop(screen.getByRole('region', { name: 'Ready' }), { dataTransfer })
    await waitFor(() => expect(mocks.moveQueueEntry).toHaveBeenCalled())
    expect(mocks.moveQueueEntry.mock.calls[0][0]).toEqual({
      queueEntryId: 'one',
      toWorkflowStatusId: 'ready',
    })
  })

  it('rejects a dragged card when the target is not an allowed transition', async () => {
    mocks.permissions.add('Queue_View')
    mocks.permissions.add('Queue_Move')
    renderPage()
    await screen.findByText('Demo One')
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      getData: () => 'one',
    }
    fireEvent.dragStart(screen.getByText('Demo One').closest('.queue-board-card')!, {
      dataTransfer,
    })
    fireEvent.drop(screen.getByRole('region', { name: 'Ready' }), { dataTransfer })
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'That workflow move is not allowed.',
    )
    expect(mocks.moveQueueEntry).not.toHaveBeenCalled()
  })
})
