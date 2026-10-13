import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPatient } from '../patients/api'
import { getActiveVisit, getPatientVisitHistory, startVisit } from './api'

const mock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('../../lib/api', () => ({ api: mock }))

describe('patient registration to visit history API journey', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes newly registered patient into check-in then requests their history', async () => {
    const patient = { id: 'patient-1', fullName: 'Demo Patient', patientNumber: 'P-001' }
    const visit = { id: 'visit-1', patientId: patient.id, doctorId: 'doctor-1', status: 'Open' }
    const history = {
      patientId: patient.id,
      visits: {
        data: [{ visitId: visit.id, status: visit.status }],
        setting: { currentPage: 1, rowCount: 10, totalCount: 1, totalPage: 1 },
      },
    }
    mock.post
      .mockResolvedValueOnce({ data: { status: true, data: patient } })
      .mockResolvedValueOnce({ data: { status: true, data: visit } })
    mock.get
      .mockResolvedValueOnce({ data: { status: true, data: visit } })
      .mockResolvedValueOnce({ data: { status: true, data: history } })

    const created = await createPatient({ fullName: 'Demo Patient', phone: '01000000001' })
    const checkedIn = await startVisit({ patientId: created.id, doctorId: 'doctor-1' })
    const active = await getActiveVisit(created.id)
    const visits = await getPatientVisitHistory(created.id)

    expect(mock.post).toHaveBeenNthCalledWith(1, '/patients', {
      fullName: 'Demo Patient', phone: '01000000001',
    })
    expect(mock.post).toHaveBeenNthCalledWith(2, '/visits/start', {
      patientId: patient.id, doctorId: 'doctor-1',
    })
    expect(mock.get).toHaveBeenNthCalledWith(1, '/visits/active', { params: { patientId: patient.id } })
    expect(mock.get).toHaveBeenNthCalledWith(2, '/visits/history', {
      params: { patientId: patient.id, page: 1, pageSize: 10 },
    })
    expect(checkedIn.patientId).toBe(created.id)
    expect(active?.id).toBe(checkedIn.id)
    expect(visits.visits.data[0].visitId).toBe(checkedIn.id)
  })

  it('does not silently accept check-in without a visit response', async () => {
    mock.post.mockResolvedValueOnce({ data: { status: false, message: 'Check-in failed' } })

    await expect(startVisit({ patientId: 'patient-1', doctorId: 'doctor-1' }))
      .rejects.toThrow('Check-in failed')
  })

  it('requests the correct visit history page', async () => {
    mock.get.mockResolvedValue({ data: { status: true, data: { patientId: 'patient-1', visits: { data: [] } } } })

    await getPatientVisitHistory('patient-1', 3, 5)

    expect(mock.get).toHaveBeenCalledWith('/visits/history', {
      params: { patientId: 'patient-1', page: 3, pageSize: 5 },
    })
  })
})
