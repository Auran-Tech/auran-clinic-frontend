import './pendingDocumentation.css'
import '../clinical/clinical.css'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { completePendingDocumentation, getPendingDocumentation } from './api'
import type { PendingDocumentation } from './types'
import { DOCUMENTATION_FIELDS } from '../documentationPolicies/api'

function PendingDocumentationEditor({
  item,
  onClose,
}: {
  item: PendingDocumentation
  onClose: () => void
}) {
  const { t } = useTranslation('pendingDocumentation')
  const queryClient = useQueryClient()
  const [chiefComplaint, setChiefComplaint] = useState(item.chiefComplaint ?? '')
  const [examination, setExamination] = useState(item.examination ?? '')
  const [diagnosis, setDiagnosis] = useState(item.diagnosis ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [treatmentPlan, setTreatmentPlan] = useState(item.treatmentPlan ?? '')

  useEffect(() => {
    setChiefComplaint(item.chiefComplaint ?? '')
    setExamination(item.examination ?? '')
    setDiagnosis(item.diagnosis ?? '')
    setNotes(item.notes ?? '')
    setTreatmentPlan(item.treatmentPlan ?? '')
  }, [item])

  const mutation = useMutation({
    mutationFn: completePendingDocumentation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pending-documentation'] })
      onClose()
    },
  })

  const missingFields =
    isAxiosError<{
      error?: string
      data?: string[]
    }>(mutation.error) &&
    mutation.error.response?.data?.error === 'documentation_required_fields_missing'
      ? (mutation.error.response.data.data ?? [])
      : []
  const clinicalFieldNames = new Map<string, string>(
    DOCUMENTATION_FIELDS.map((field) => [
      field.key,
      t(field.key, { defaultValue: field.label }),
    ]),
  )

  const hasContent = Boolean(
    chiefComplaint.trim() ||
    examination.trim() ||
    diagnosis.trim() ||
    notes.trim() ||
    treatmentPlan.trim(),
  )

  return (
    <section className="pending-editor">
      <div className="panel-heading">
        <div>
          <h2>{item.patientName}</h2>
          <p className="muted mono">{item.patientNumber}</p>
        </div>
        <button className="button secondary" onClick={onClose}>
          {t('close')}
        </button>
      </div>

      <div className="clinical-form">
        <label>
          <span>{t('chiefComplaint')}</span>
          <textarea
            rows={3}
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
          />
        </label>
        <label>
          <span>{t('examination')}</span>
          <textarea
            rows={4}
            value={examination}
            onChange={(e) => setExamination(e.target.value)}
          />
        </label>
        <label>
          <span>{t('diagnosis')}</span>
          <textarea
            rows={4}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </label>
        <label>
          <span>{t('treatmentPlan')}</span>
          <textarea
            rows={4}
            value={treatmentPlan}
            onChange={(e) => setTreatmentPlan(e.target.value)}
          />
        </label>
        <label className="full-width">
          <span>{t('clinicalNotes')}</span>
          <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      <div className="actions clinical-actions">
        <button
          className="button primary"
          disabled={!hasContent || mutation.isPending}
          onClick={() =>
            mutation.mutate({
              visitId: item.visitId,
              chiefComplaint: chiefComplaint || undefined,
              examination: examination || undefined,
              diagnosis: diagnosis || undefined,
              notes: notes || undefined,
              treatmentPlan: treatmentPlan || undefined,
            })
          }
        >
          {mutation.isPending ? t('completing') : t('completeDocumentation')}
        </button>
      </div>

      {mutation.isError && (
        <div className="field-error" role="alert">
          {missingFields.length > 0 ? (
            <>
              <p>{t('requiredFields')}</p>
              <ul>
                {missingFields.map((field) => (
                  <li key={field}>{clinicalFieldNames.get(field) ?? field}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>{t('completeError')}</p>
          )}
        </div>
      )}
    </section>
  )
}

export function PendingDocumentationPage() {
  const { t, i18n } = useTranslation('pendingDocumentation')
  const auth = useAuth()
  const [selected, setSelected] = useState<PendingDocumentation | null>(null)
  const [mineOnly, setMineOnly] = useState(true)

  const query = useQuery({
    queryKey: ['pending-documentation', mineOnly],
    queryFn: () => getPendingDocumentation(mineOnly),
    enabled: auth.hasPermission('Visit_View'),
  })

  if (!auth.hasPermission('Visit_View')) {
    return (
      <main className="page-shell">
        <p className="state error">{t('forbidden')}</p>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t('title')}</h1>
          <p className="muted">{t('subtitle')}</p>
        </div>
        <div className="actions">
          {auth.session?.user.isSuperUser && (
            <label className="inline-toggle">
              <input
                type="checkbox"
                checked={!mineOnly}
                onChange={(event) => setMineOnly(!event.target.checked)}
              />
              <span>{t('allDoctors')}</span>
            </label>
          )}
          {auth.hasPermission('FollowUp_View') && (
            <Link className="button secondary nav-button" to="/follow-ups">
              {t('followUps')}
            </Link>
          )}
          <Link className="button secondary nav-button" to="/queue">
            {t('liveQueue')}
          </Link>
          <Link className="button secondary nav-button" to="/patients">
            {t('patients')}
          </Link>
        </div>
      </section>

      <section className="panel">
        {query.isLoading && <p className="state">{t('loading')}</p>}
        {query.isError && <p className="state error">{t('loadError')}</p>}
        {query.data?.length === 0 && <p className="state">{t('empty')}</p>}

        {query.data && query.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('patient')}</th>
                  <th>{t('doctor')}</th>
                  <th>{t('visit')}</th>
                  <th>{t('documentation')}</th>
                  <th>{t('started')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((item) => (
                  <tr key={item.visitId}>
                    <td>
                      <Link className="patient-link" to={`/patients/${item.patientId}`}>
                        <strong>{item.patientName}</strong>
                      </Link>
                      <div className="muted mono">{item.patientNumber}</div>
                    </td>
                    <td>{item.doctorName}</td>
                    <td>{t(item.visitStatus, { defaultValue: item.visitStatus })}</td>
                    <td>
                      {t(item.documentationStatus, {
                        defaultValue: item.documentationStatus,
                      })}
                    </td>
                    <td>{new Date(item.entryAtUtc).toLocaleString(i18n.language)}</td>
                    <td>
                      {auth.hasPermission('Visit_Edit') && (
                        <button
                          className="button secondary"
                          onClick={() => setSelected(item)}
                        >
                          {t('finishNote')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <section className="panel">
          <PendingDocumentationEditor item={selected} onClose={() => setSelected(null)} />
        </section>
      )}
    </main>
  )
}
