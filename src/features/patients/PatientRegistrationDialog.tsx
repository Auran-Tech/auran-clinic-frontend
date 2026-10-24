import './PatientRegistrationDialog.css'
import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { createPatient, findPatientDuplicates } from './api'
import { duplicateReviewKey } from './duplicateReview'
import { patientSchema, type PatientFormValues } from './schema'
import type { CreatePatientInput, PatientDuplicateCandidate } from './types'

interface PatientRegistrationDialogProps {
  onClose: () => void
}

export function PatientRegistrationDialog({ onClose }: PatientRegistrationDialogProps) {
  const { t } = useTranslation('patients')
  const queryClient = useQueryClient()
  const dialogRef = useRef<HTMLElement>(null)
  const [duplicates, setDuplicates] = useState<PatientDuplicateCandidate[]>([])
  const [reviewedInput, setReviewedInput] = useState<CreatePatientInput | null>(null)
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      notes: '',
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
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
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
      document.querySelector<HTMLButtonElement>('.patients-register-button')?.focus()
    }
  }, [onClose])

  const createMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['patients'] })
      onClose()
    },
  })
  const duplicateMutation = useMutation({ mutationFn: findPatientDuplicates })
  const hasExactPhoneDuplicate = duplicates.some(
    (patient) => patient.matchReason === 'phone',
  )

  const onSubmit = form.handleSubmit(async (values) => {
    const normalized = {
      ...values,
      gender: values.gender || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      notes: values.notes || undefined,
    }
    const requestKey = duplicateReviewKey(normalized)
    let matches: PatientDuplicateCandidate[]
    try {
      matches = await duplicateMutation.mutateAsync(normalized)
    } catch {
      return
    }
    if (duplicateReviewKey(form.getValues()) !== requestKey) return

    if (matches.length > 0) {
      setReviewedInput(normalized)
      setDuplicates(matches)
      return
    }

    setReviewedInput(null)
    setDuplicates([])
    createMutation.mutate(normalized)
  })

  return (
    <div
      className="patient-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        className="patient-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-dialog-title"
      >
        <header className="patient-dialog-header">
          <div>
            <h2 id="patient-dialog-title">{t('registerNew')}</h2>
            <p>{t('registerSubtitle')}</p>
          </div>
          <button type="button" aria-label={t('close')} onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form
          className="patient-dialog-form"
          onSubmit={onSubmit}
          onChange={() => {
            setDuplicates([])
            setReviewedInput(null)
          }}
        >
          <div className="patient-dialog-fields">
            <label>
              <span>{t('fullName')}</span>
              <input {...form.register('fullName')} autoFocus />
              {form.formState.errors.fullName && (
                <small className="field-error">
                  {form.formState.errors.fullName.message}
                </small>
              )}
            </label>
            <label>
              <span>{t('phone')}</span>
              <input {...form.register('phone')} inputMode="tel" dir="ltr" />
              {form.formState.errors.phone && (
                <small className="field-error">
                  {form.formState.errors.phone.message}
                </small>
              )}
            </label>
            <label>
              <span>{t('dateOfBirth')}</span>
              <input type="date" {...form.register('dateOfBirth')} />
            </label>
            <label>
              <span>{t('gender')}</span>
              <select {...form.register('gender')}>
                <option value="">{t('notSpecified')}</option>
                <option value="Female">{t('female')}</option>
                <option value="Male">{t('male')}</option>
              </select>
            </label>
            <label className="patient-dialog-wide">
              <span>{t('notes')}</span>
              <textarea rows={3} {...form.register('notes')} />
            </label>

            {duplicates.length > 0 && (
              <div className="duplicate-warning patient-dialog-wide" role="alert">
                <strong>{t('possibleDuplicate')}</strong>
                <p>{hasExactPhoneDuplicate ? t('samePhone') : t('reviewDuplicates')}</p>
                <ul>
                  {duplicates.map((patient) => (
                    <li key={patient.id}>
                      <span>{patient.fullName}</span>
                      <span>{patient.patientNumber}</span>
                      <span>{patient.phone}</span>
                    </li>
                  ))}
                </ul>
                <div className="actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setDuplicates([])
                      setReviewedInput(null)
                    }}
                  >
                    {t('editDetails')}
                  </button>
                  {!hasExactPhoneDuplicate && (
                    <button
                      type="button"
                      className="button danger"
                      onClick={() => {
                        if (
                          !reviewedInput ||
                          duplicateReviewKey(form.getValues()) !==
                            duplicateReviewKey(reviewedInput)
                        ) {
                          setDuplicates([])
                          setReviewedInput(null)
                          return
                        }
                        createMutation.mutate(reviewedInput)
                      }}
                    >
                      {t('createAnyway')}
                    </button>
                  )}
                </div>
              </div>
            )}
            {duplicateMutation.isError && (
              <p className="field-error patient-dialog-wide" role="alert">
                {t('duplicateError')}
              </p>
            )}
            {createMutation.isError && (
              <p className="field-error patient-dialog-wide" role="alert">
                {t('createError')}
              </p>
            )}
          </div>
          <footer className="patient-dialog-footer">
            <button type="button" className="button secondary" onClick={onClose}>
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={duplicateMutation.isPending || createMutation.isPending}
            >
              <Check size={15} aria-hidden="true" />
              {duplicateMutation.isPending ? t('checking') : t('register')}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
