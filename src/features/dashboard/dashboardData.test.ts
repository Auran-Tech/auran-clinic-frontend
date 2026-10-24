import { describe, expect, it } from 'vitest'
import type { QueueEntry } from '../queue/types'
import {
  averageTimeInFlow,
  groupDoctorLoad,
  groupQueueStages,
  parseUtcTimestamp,
  queueDonutGradient,
} from './dashboardData'

const entry = (overrides: Partial<QueueEntry> = {}): QueueEntry => ({
  queueEntryId: 'entry-1',
  visitId: 'visit-1',
  patientId: 'patient-1',
  patientNumber: 'P-1',
  patientName: 'Patient One',
  doctorId: 'doctor-1',
  doctorName: 'Doctor One',
  workflowStatusId: 'waiting',
  workflowStatusCode: 'WAITING',
  workflowStatusName: 'Waiting',
  workflowStatusColor: '#3b82f6',
  entryAtUtc: '2026-10-24T10:00:00',
  ...overrides,
})

describe('dashboard queue data', () => {
  it('treats an API timestamp without an offset as UTC', () => {
    expect(parseUtcTimestamp('2026-10-24T10:00:00')).toBe(
      Date.parse('2026-10-24T10:00:00Z'),
    )
    expect(averageTimeInFlow([entry()], Date.parse('2026-10-24T10:20:00Z'))).toBe(20)
  })

  it('groups real queue stages and doctor assignments', () => {
    const entries = [
      entry(),
      entry({ queueEntryId: 'entry-2', patientId: 'patient-2' }),
      entry({
        queueEntryId: 'entry-3',
        patientId: 'patient-3',
        doctorId: null,
        doctorName: null,
        workflowStatusId: 'ready',
        workflowStatusName: 'Ready',
        workflowStatusColor: '#10b981',
      }),
    ]

    const stages = groupQueueStages(entries)
    expect(stages.map((stage) => stage.count)).toEqual([2, 1])
    expect(groupDoctorLoad(entries, 'Unassigned').map((doctor) => doctor.count)).toEqual([
      2, 1,
    ])
    expect(queueDonutGradient(stages)).toContain('#3b82f6 0%')
  })
})
