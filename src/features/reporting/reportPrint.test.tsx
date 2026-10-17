// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReportingPage } from './ReportingPage'

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  print: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (name: string) => mocks.permissions.has(name) }),
}))
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'visit-report') return {
      data: { rows: [], totalCount: 0 }, isFetching: false, isLoading: false, isError: false,
    }
    return { data: null, isFetching: false, isLoading: false, isError: false }
  },
}))
vi.mock('./api', () => ({
  getDashboardSummary: vi.fn(),
  getVisitReport: vi.fn(),
  exportVisitReport: vi.fn(),
  exportVisitReportXlsx: vi.fn(),
}))
vi.mock('../employees/api', () => ({ getEmployees: vi.fn() }))
vi.mock('./patientReportApi', () => ({ getPatientReport: vi.fn(), exportPatientReportCsv: vi.fn() }))
vi.mock('./queueReportApi', () => ({ getQueueReport: vi.fn(), exportQueueReportCsv: vi.fn() }))

afterEach(() => {
  cleanup()
  mocks.permissions.clear()
  vi.unstubAllGlobals()
})

describe('report print permissions', () => {
  it('does not offer print or export to Reports_View-only users', () => {
    mocks.permissions.add('Reports_View')
    render(<MemoryRouter><ReportingPage /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: 'Print / Save PDF' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull()
  })
  it('prints only on an explicit authorized click', () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Reports_Export')
    mocks.print.mockClear()
    vi.stubGlobal('print', mocks.print)
    render(<MemoryRouter><ReportingPage /></MemoryRouter>)
    expect(mocks.print).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Print / Save PDF' }))
    expect(mocks.print).toHaveBeenCalledTimes(1)
  })
})
