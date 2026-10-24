import type { QueueEntry } from '../queue/types'

export interface QueueStage {
  id: string
  name: string
  color: string
  count: number
}

export interface DoctorLoad {
  id: string
  name: string
  count: number
}

export function parseUtcTimestamp(value: string): number | null {
  const normalized = /(?:Z|[+-]\d\d:\d\d)$/i.test(value) ? value : `${value}Z`
  const timestamp = Date.parse(normalized)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function averageTimeInFlow(
  entries: QueueEntry[],
  now = Date.now(),
): number | null {
  const elapsed = entries
    .map((entry) => parseUtcTimestamp(entry.entryAtUtc))
    .filter((timestamp): timestamp is number => timestamp !== null)
    .map((timestamp) => Math.max(0, now - timestamp))

  if (elapsed.length === 0) return null
  return Math.round(
    elapsed.reduce((total, value) => total + value, 0) / elapsed.length / 60_000,
  )
}

export function groupQueueStages(entries: QueueEntry[]): QueueStage[] {
  const stages = new Map<string, QueueStage>()
  for (const entry of entries) {
    const stage = stages.get(entry.workflowStatusId)
    if (stage) {
      stage.count += 1
    } else {
      stages.set(entry.workflowStatusId, {
        id: entry.workflowStatusId,
        name: entry.workflowStatusName,
        color: /^#[0-9a-f]{6}$/i.test(entry.workflowStatusColor)
          ? entry.workflowStatusColor
          : '#4c8dff',
        count: 1,
      })
    }
  }
  return [...stages.values()].sort((first, second) => second.count - first.count)
}

export function groupDoctorLoad(entries: QueueEntry[], unassigned: string): DoctorLoad[] {
  const doctors = new Map<string, DoctorLoad>()
  for (const entry of entries) {
    const id = entry.doctorId || 'unassigned'
    const doctor = doctors.get(id)
    if (doctor) {
      doctor.count += 1
    } else {
      doctors.set(id, {
        id,
        name: entry.doctorName || unassigned,
        count: 1,
      })
    }
  }
  return [...doctors.values()].sort((first, second) => second.count - first.count)
}

export function queueDonutGradient(stages: QueueStage[]): string {
  const total = stages.reduce((count, stage) => count + stage.count, 0)
  if (total === 0) return 'var(--auran-border)'

  let start = 0
  const segments = stages.map((stage) => {
    const end = start + (stage.count / total) * 100
    const segment = `${stage.color} ${start}% ${end}%`
    start = end
    return segment
  })
  return `conic-gradient(${segments.join(', ')})`
}
