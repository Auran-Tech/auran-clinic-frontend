// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportingPage } from './ReportingPage'

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  mutation: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (permission: string) => mocks.permissions.has(permission) }),
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => (
    queryKey[0] === 'visit-report'
      ? { data: { rows: [], totalCount: 0 }, isLoading: false, isError: false }
      : { data: null, isLoading: false, isError: false }
  ),
  useMutation: () => ({ mutate: mocks.mutation, isPending: false, isError: false }),
}))
vi.mock('./api', () => ({
  getDashboardSummary: vi.fn(), getVisitReport: vi.fn(),
  exportVisitReport: vi.fn(), exportVisitReportXlsx: vi.fn(),
}))
vi.mock('../employees/api', () => ({ getEmployees: vi.fn() }))
vi.mock('./patientReportApi', () => ({ getPatientReport: vi.fn(), exportPatientReportCsv: vi.fn() }))
vi.mock('./queueReportApi', () => ({ getQueueReport: vi.fn(), exportQueueReportCsv: vi.fn() }))
vi.mock('./doctorActivityApi', () => ({ getDoctorActivity: vi.fn(), exportDoctorActivityCsv: vi.fn() }))

beforeEach(() => { mocks.permissions.clear(); mocks.mutation.mockReset() })
afterEach(cleanup)

describe('visit Excel export permissions', () => {
  it('does not allow export for a reports read-only actor', () => {
    mocks.permissions.add('Reports_View')
    render(<MemoryRouter><ReportingPage /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: 'Export Excel (.xlsx)' })).toBeNull()
    expect(mocks.mutation).not.toHaveBeenCalled()
  })

  it('uses the same normalized filters as the report preview', () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Reports_Export')
    render(<MemoryRouter><ReportingPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('Documentation'), { target: { value: 'Pending' } })
    fireEvent.click(screen.getByRole('button', { name: 'Export Excel (.xlsx)' }))
    expect(mocks.mutation).toHaveBeenCalledWith(expect.objectContaining({
      fromDate: '2026-10-01', documentationStatus: 'Pending',
    }))
  })
})
