// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '../../i18n'
import { QueueReportPanel } from './QueueReportPanel'

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  mutate: vi.fn(),
  queries: vi.fn(),
}))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    hasPermission: (permission: string) => mocks.permissions.has(permission),
  }),
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: unknown[]; enabled: boolean }) => {
    mocks.queries(options)
    return {
      data: options.queryKey[0] === 'queue-report' ? { rows: [], totalCount: 0 } : [],
      isError: false,
      isLoading: false,
    }
  },
  useMutation: () => ({ mutate: mocks.mutate, isPending: false, isError: false }),
}))
vi.mock('./queueReportApi', () => ({
  getQueueReport: vi.fn(),
  exportQueueReportCsv: vi.fn(),
}))
vi.mock('../employees/api', () => ({ getEmployees: vi.fn() }))
beforeEach(() => {
  mocks.permissions.clear()
  mocks.mutate.mockReset()
  mocks.queries.mockReset()
})
afterEach(cleanup)

describe('Queue report actor boundary', () => {
  it('does not query or show queue data without Reports_View', () => {
    render(
      <MemoryRouter>
        <QueueReportPanel />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Clinic queue report')).toBeNull()
    expect(mocks.queries).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    )
  })

  it('permits report preview without exporting', () => {
    mocks.permissions.add('Reports_View')
    render(
      <MemoryRouter>
        <QueueReportPanel />
      </MemoryRouter>,
    )
    expect(screen.getByText('Clinic queue report')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Export queue CSV' })).toBeNull()
    expect(mocks.queries).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('keeps selected filters in authorized export', () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Reports_Export')
    render(
      <MemoryRouter>
        <QueueReportPanel />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.change(screen.getByLabelText('Queue from'), {
      target: { value: '2026-10-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
    fireEvent.click(screen.getByRole('button', { name: 'Export queue CSV' }))
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ fromDate: '2026-10-01' }),
    )
  })

  it('blocks reversed draft dates before applying them', () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Reports_Export')
    render(
      <MemoryRouter>
        <QueueReportPanel />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.change(screen.getByLabelText('Queue from'), {
      target: { value: '2026-10-17' },
    })
    fireEvent.change(screen.getByLabelText('Queue to'), {
      target: { value: '2026-10-01' },
    })
    expect(screen.getByRole('alert').textContent).toContain('on or before')
    expect(
      screen.getByRole('button', { name: 'Apply filters' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(mocks.queries).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['queue-report']),
        enabled: true,
      }),
    )
  })
})
