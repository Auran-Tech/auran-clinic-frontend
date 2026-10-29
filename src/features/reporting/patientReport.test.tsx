// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '../../i18n'
import { PatientReportPanel } from './PatientReportPanel'

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  mutate: vi.fn(),
  queryFn: vi.fn(),
}))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    hasPermission: (permission: string) => mocks.permissions.has(permission),
  }),
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: {
    queryKey: unknown[]
    queryFn: () => unknown
    enabled: boolean
  }) => {
    mocks.queryFn(options)
    return { data: { rows: [], totalCount: 0 }, isError: false, isLoading: false }
  },
  useMutation: () => ({ mutate: mocks.mutate, isPending: false, isError: false }),
}))
vi.mock('./patientReportApi', () => ({
  getPatientReport: vi.fn(),
  exportPatientReportCsv: vi.fn(),
}))

beforeEach(() => {
  mocks.permissions.clear()
  mocks.mutate.mockReset()
  mocks.queryFn.mockReset()
})
afterEach(cleanup)

describe('Patient report UI boundary', () => {
  it('hides all patient report actions for unauthorized users', () => {
    render(
      <MemoryRouter>
        <PatientReportPanel />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Patients report')).toBeNull()
    expect(mocks.queryFn).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    )
  })

  it('lets read-only reporting users preview without exporting', () => {
    mocks.permissions.add('Reports_View')
    render(
      <MemoryRouter>
        <PatientReportPanel />
      </MemoryRouter>,
    )
    expect(screen.getByText('Patients report')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Export patients CSV' })).toBeNull()
    expect(mocks.queryFn).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('sends selected clinic date filters to authorized CSV export', () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Reports_Export')
    render(
      <MemoryRouter>
        <PatientReportPanel />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.change(screen.getByLabelText('Registered from'), {
      target: { value: '2026-10-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
    fireEvent.click(screen.getByRole('button', { name: 'Export patients CSV' }))
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        fromDate: '2026-10-01',
      }),
    )
  })

  it('rejects reversed draft dates before applying them', () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Reports_Export')
    render(
      <MemoryRouter>
        <PatientReportPanel />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.change(screen.getByLabelText('Registered from'), {
      target: { value: '2026-10-16' },
    })
    fireEvent.change(screen.getByLabelText('Registered to'), {
      target: { value: '2026-10-01' },
    })
    expect(screen.getByRole('alert').textContent).toContain('on or before')
    expect(
      screen.getByRole('button', { name: 'Apply filters' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(mocks.queryFn).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['patients-report']),
        enabled: true,
      }),
    )
  })
})
