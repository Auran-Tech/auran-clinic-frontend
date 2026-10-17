// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DoctorActivityPanel } from './DoctorActivityPanel'

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  mutate: vi.fn(),
  queries: vi.fn(),
}))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (permission: string) => mocks.permissions.has(permission) }),
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: unknown[]; enabled: boolean }) => {
    mocks.queries(options)
    return { data: options.queryKey[0] === 'doctor-activity-report' ? { rows: [], totalCount: 0 } : [], isError: false, isLoading: false }
  },
  useMutation: () => ({ mutate: mocks.mutate, isPending: false, isError: false }),
}))
vi.mock('./doctorActivityApi', () => ({ getDoctorActivity: vi.fn(), exportDoctorActivityCsv: vi.fn() }))
vi.mock('../employees/api', () => ({ getEmployees: vi.fn() }))
beforeEach(() => { mocks.permissions.clear(); mocks.mutate.mockReset(); mocks.queries.mockReset() })
afterEach(cleanup)

describe('Doctor Activity report actor boundary', () => {
  it('does not load or display doctor metrics without Reports_View', () => {
    render(<MemoryRouter><DoctorActivityPanel /></MemoryRouter>)
    expect(screen.queryByText('Doctor activity report')).toBeNull()
    expect(mocks.queries).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
  it('lets read-only reporting users preview without exporting', () => {
    mocks.permissions.add('Reports_View')
    render(<MemoryRouter><DoctorActivityPanel /></MemoryRouter>)
    expect(screen.getByText('Doctor activity report')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Export doctor CSV' })).toBeNull()
  })
  it('exports only with permissions and selected filters', () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Reports_Export')
    render(<MemoryRouter><DoctorActivityPanel /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Activity from'), { target: { value: '2026-10-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Export doctor CSV' }))
    expect(mocks.mutate).toHaveBeenCalledWith(expect.objectContaining({ fromDate: '2026-10-01' }))
  })
  it('blocks invalid date range before querying or exporting', () => {
    mocks.permissions.add('Reports_View')
    mocks.permissions.add('Reports_Export')
    render(<MemoryRouter><DoctorActivityPanel /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Activity from'), { target: { value: '2026-10-17' } })
    fireEvent.change(screen.getByLabelText('Activity to'), { target: { value: '2026-10-01' } })
    expect(screen.getByRole('alert').textContent).toContain('on or before')
    expect(screen.getByRole('button', { name: 'Export doctor CSV' }).hasAttribute('disabled')).toBe(true)
    expect(mocks.queries).toHaveBeenCalledWith(expect.objectContaining({ queryKey: expect.arrayContaining(['doctor-activity-report']), enabled: false }))
  })
})
