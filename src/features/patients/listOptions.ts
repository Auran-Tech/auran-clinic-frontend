export const PATIENT_GENDER = {
  male: 'Male',
  female: 'Female',
  unspecified: 'Unspecified',
} as const

export const PATIENT_SORT_FIELD = {
  name: 'name',
  patientNumber: 'patientNumber',
  phone: 'phone',
  gender: 'gender',
  createdDate: 'createdDate',
} as const

export const PATIENT_SORT_CHOICE = {
  nameAsc: 'name-asc',
  nameDesc: 'name-desc',
  numberAsc: 'number-asc',
  numberDesc: 'number-desc',
  phoneAsc: 'phone-asc',
  phoneDesc: 'phone-desc',
  genderAsc: 'gender-asc',
  genderDesc: 'gender-desc',
  newest: 'newest',
  oldest: 'oldest',
} as const

export type PatientSortChoice =
  (typeof PATIENT_SORT_CHOICE)[keyof typeof PATIENT_SORT_CHOICE]

export const PATIENT_SORT_QUERY: Record<
  PatientSortChoice,
  {
    sortBy: (typeof PATIENT_SORT_FIELD)[keyof typeof PATIENT_SORT_FIELD]
    descending: boolean
  }
> = {
  [PATIENT_SORT_CHOICE.nameAsc]: {
    sortBy: PATIENT_SORT_FIELD.name,
    descending: false,
  },
  [PATIENT_SORT_CHOICE.nameDesc]: {
    sortBy: PATIENT_SORT_FIELD.name,
    descending: true,
  },
  [PATIENT_SORT_CHOICE.numberAsc]: {
    sortBy: PATIENT_SORT_FIELD.patientNumber,
    descending: false,
  },
  [PATIENT_SORT_CHOICE.numberDesc]: {
    sortBy: PATIENT_SORT_FIELD.patientNumber,
    descending: true,
  },
  [PATIENT_SORT_CHOICE.phoneAsc]: {
    sortBy: PATIENT_SORT_FIELD.phone,
    descending: false,
  },
  [PATIENT_SORT_CHOICE.phoneDesc]: {
    sortBy: PATIENT_SORT_FIELD.phone,
    descending: true,
  },
  [PATIENT_SORT_CHOICE.genderAsc]: {
    sortBy: PATIENT_SORT_FIELD.gender,
    descending: false,
  },
  [PATIENT_SORT_CHOICE.genderDesc]: {
    sortBy: PATIENT_SORT_FIELD.gender,
    descending: true,
  },
  [PATIENT_SORT_CHOICE.newest]: {
    sortBy: PATIENT_SORT_FIELD.createdDate,
    descending: true,
  },
  [PATIENT_SORT_CHOICE.oldest]: {
    sortBy: PATIENT_SORT_FIELD.createdDate,
    descending: false,
  },
}
