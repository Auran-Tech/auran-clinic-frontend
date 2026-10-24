import './QueueArrivalDialog.css'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, Search, X } from 'lucide-react'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { getPatients } from '../patients/api'
import { getVisitDoctors, startVisit } from '../visits/api'

interface QueueArrivalDialogProps {
  activePatientIds: string[]
  onClose: () => void
}

export function QueueArrivalDialog({
  activePatientIds,
  onClose,
}: QueueArrivalDialogProps) {
  const { t } = useTranslation('queue')
  const queryClient = useQueryClient()
  const dialogRef = useRef<HTMLElement>(null)
  const [search, setSearch] = useState('')
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const patientsQuery = useQuery({
    queryKey: ['queue-arrival-patients', search],
    queryFn: () => getPatients({ search: search || undefined, page: 1, pageSize: 50 }),
  })
  const doctorsQuery = useQuery({
    queryKey: ['visit-doctors'],
    queryFn: getVisitDoctors,
  })
  const startMutation = useMutation({
    mutationFn: startVisit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['queue'] })
      await queryClient.invalidateQueries({ queryKey: ['active-queue'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      await queryClient.invalidateQueries({ queryKey: ['active-visit', patientId] })
      onClose()
    },
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.querySelector<HTMLButtonElement>('.queue-arrival-button')?.focus()
    }
  }, [onClose])

  const activeIds = new Set(activePatientIds)
  const patients = patientsQuery.data?.data ?? []
  const doctors = doctorsQuery.data ?? []
  const patientOptions = patients.map((patient) => ({
    label: `${patient.patientNumber} — ${patient.fullName}${
      activeIds.has(patient.id) ? ` (${t('alreadyInQueue')})` : ''
    }`,
    value: patient.id,
    disabled: activeIds.has(patient.id),
  }))
  const doctorOptions = doctors.map((doctor) => ({
    label: doctor.fullName,
    value: doctor.id,
  }))

  return (
    <div
      className="queue-arrival-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        className="queue-arrival-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-arrival-title"
      >
        <header className="queue-arrival-header">
          <div>
            <h2 id="queue-arrival-title">{t('registerArrival')}</h2>
            <p>{t('arrivalSubtitle')}</p>
          </div>
          <button type="button" aria-label={t('close')} onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (patientId && doctorId) startMutation.mutate({ patientId, doctorId })
          }}
        >
          <div className="queue-arrival-fields">
            <label>
              <span>{t('searchPatient')}</span>
              <span className="queue-arrival-search">
                <Search size={15} aria-hidden="true" />
                <InputText
                  value={search}
                  className="auran-prime-field"
                  autoFocus
                  placeholder={t('search')}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPatientId('')
                  }}
                />
              </span>
            </label>
            <label>
              <span>{t('patient')}</span>
              <Dropdown
                className="auran-prime-field"
                panelClassName="auran-prime-panel"
                value={patientId}
                disabled={patientsQuery.isLoading || patientsQuery.isError}
                options={patientOptions}
                optionLabel="label"
                optionValue="value"
                optionDisabled="disabled"
                placeholder={t('selectPatient')}
                filter
                aria-label={t('patient')}
                onChange={(event) => setPatientId(event.value as string)}
              />
              {patientsQuery.data && patients.length === 0 && (
                <small>{t('noPatientsFound')}</small>
              )}
              {patientsQuery.isError && (
                <small className="field-error" role="alert">
                  {t('patientsLoadError')}
                </small>
              )}
            </label>
            <label>
              <span>{t('doctor')}</span>
              <Dropdown
                className="auran-prime-field"
                panelClassName="auran-prime-panel"
                value={doctorId}
                disabled={doctorsQuery.isLoading || doctorsQuery.isError}
                options={doctorOptions}
                optionLabel="label"
                optionValue="value"
                placeholder={t('selectDoctor')}
                filter
                aria-label={t('doctor')}
                onChange={(event) => setDoctorId(event.value as string)}
              />
              {doctorsQuery.isError && (
                <small className="field-error" role="alert">
                  {t('doctorsLoadError')}
                </small>
              )}
            </label>
            {startMutation.isError && (
              <p className="field-error" role="alert">
                {t('checkInError')}
              </p>
            )}
          </div>
          <footer className="queue-arrival-footer">
            <button type="button" className="button secondary" onClick={onClose}>
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={!patientId || !doctorId || startMutation.isPending}
            >
              <Check size={15} aria-hidden="true" />
              {startMutation.isPending ? t('checkingIn') : t('registerArrival')}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
