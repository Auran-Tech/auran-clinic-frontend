export const QUEUE_SORT_FIELD = {
  stage: 'stage',
  arrival: 'arrival',
  patientName: 'patientName',
  doctorName: 'doctorName',
} as const

export const QUEUE_SORT_CHOICE = {
  stage: 'stage',
  stageDesc: 'stage-desc',
  longestWait: 'longest-wait',
  newestArrival: 'newest-arrival',
  nameAsc: 'name-asc',
  nameDesc: 'name-desc',
  doctorAsc: 'doctor-asc',
  doctorDesc: 'doctor-desc',
} as const

export type QueueSortChoice = (typeof QUEUE_SORT_CHOICE)[keyof typeof QUEUE_SORT_CHOICE]

export const QUEUE_SORT_QUERY: Record<
  QueueSortChoice,
  {
    sortBy: (typeof QUEUE_SORT_FIELD)[keyof typeof QUEUE_SORT_FIELD]
    descending: boolean
  }
> = {
  [QUEUE_SORT_CHOICE.stage]: {
    sortBy: QUEUE_SORT_FIELD.stage,
    descending: false,
  },
  [QUEUE_SORT_CHOICE.stageDesc]: {
    sortBy: QUEUE_SORT_FIELD.stage,
    descending: true,
  },
  [QUEUE_SORT_CHOICE.longestWait]: {
    sortBy: QUEUE_SORT_FIELD.arrival,
    descending: false,
  },
  [QUEUE_SORT_CHOICE.newestArrival]: {
    sortBy: QUEUE_SORT_FIELD.arrival,
    descending: true,
  },
  [QUEUE_SORT_CHOICE.nameAsc]: {
    sortBy: QUEUE_SORT_FIELD.patientName,
    descending: false,
  },
  [QUEUE_SORT_CHOICE.nameDesc]: {
    sortBy: QUEUE_SORT_FIELD.patientName,
    descending: true,
  },
  [QUEUE_SORT_CHOICE.doctorAsc]: {
    sortBy: QUEUE_SORT_FIELD.doctorName,
    descending: false,
  },
  [QUEUE_SORT_CHOICE.doctorDesc]: {
    sortBy: QUEUE_SORT_FIELD.doctorName,
    descending: true,
  },
}
