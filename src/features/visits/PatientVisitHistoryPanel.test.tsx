// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PatientVisitHistoryPanel } from './PatientVisitHistoryPanel'
import i18n from '../../i18n'

const getHistory = vi.hoisted(() => vi.fn())
vi.mock('./api', () => ({ getPatientVisitHistory: getHistory }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  void i18n.changeLanguage('en')
})

describe('PatientVisitHistoryPanel rendering', () => {
  it('renders a clinic visit with its doctor, status and diagnosis', async () => {
    getHistory.mockResolvedValue({
      patientId: 'patient-1',
      visits: {
        data: [
          {
            visitId: 'visit-1',
            doctorId: 'doctor-1',
            doctorName: 'Demo Doctor',
            status: 'Open',
            documentationStatus: 'Pending',
            entryAtUtc: '2026-10-13T09:00:00Z',
            sessionCount: 1,
            chiefComplaint: 'Headache',
            diagnosis: 'Migraine',
          },
        ],
        setting: { currentPage: 1, totalPage: 1, totalCount: 1, rowCount: 1 },
      },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <PatientVisitHistoryPanel patientId="patient-1" />
      </QueryClientProvider>,
    )
    expect(await screen.findByText('Dr. Demo Doctor')).toBeTruthy()
    expect(screen.getByText('Pending')).toBeTruthy()
    expect(screen.getByText('Migraine')).toBeTruthy()
    expect(screen.getByText('Headache')).toBeTruthy()
    expect(getHistory).toHaveBeenCalledWith('patient-1', 1, 10)
  })

  it('renders empty history without producing a visit card', async () => {
    getHistory.mockResolvedValue({
      patientId: 'patient-2',
      visits: {
        data: [],
        setting: { currentPage: 1, totalPage: 0, totalCount: 0, rowCount: 0 },
      },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <PatientVisitHistoryPanel patientId="patient-2" />
      </QueryClientProvider>,
    )
    expect(
      await screen.findByText('No clinic visits recorded for this patient.'),
    ).toBeTruthy()
    expect(container.querySelectorAll('.visit-history-card')).toHaveLength(0)
  })

  it('shows visit history labels and status in Arabic', async () => {
    await i18n.changeLanguage('ar')
    getHistory.mockResolvedValue({
      patientId: 'patient-3',
      visits: {
        data: [
          {
            visitId: 'visit-3',
            doctorId: 'doctor-3',
            doctorName: 'Demo Doctor',
            status: 'Open',
            documentationStatus: 'Pending',
            entryAtUtc: '2026-10-13T09:00:00Z',
            sessionCount: 1,
          },
        ],
        setting: { currentPage: 1, totalPage: 1, totalCount: 1, rowCount: 1 },
      },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <PatientVisitHistoryPanel patientId="patient-3" />
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'سجل الزيارات' })).toBeTruthy()
    expect(await screen.findByText('معلّق')).toBeTruthy()
    expect(screen.getByText('د. Demo Doctor')).toBeTruthy()
  })
})
