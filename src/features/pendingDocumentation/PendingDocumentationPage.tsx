import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  completePendingDocumentation,
  getPendingDocumentation,
} from './api'
import type { PendingDocumentation } from './types'

function PendingDocumentationEditor({
  item,
  onClose,
}: {
  item: PendingDocumentation
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
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
        <button className="button secondary" onClick={onClose}>{t('pendingDocs.close')}</button>
      </div>

      <div className="clinical-form">
        <label>
          <span>{t('clinicalWorkspace.chiefComplaint')}</span>
          <textarea rows={3} value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
        </label>
        <label>
          <span>{t('clinicalWorkspace.examination')}</span>
          <textarea rows={4} value={examination} onChange={(e) => setExamination(e.target.value)} />
        </label>
        <label>
          <span>{t('clinicalWorkspace.diagnosis')}</span>
          <textarea rows={4} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </label>
        <label>
          <span>{t('clinicalWorkspace.treatmentPlan')}</span>
          <textarea rows={4} value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} />
        </label>
        <label className="full-width">
          <span>{t('clinicalWorkspace.notes')}</span>
          <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      <div className="actions clinical-actions">
        <button
          className="button primary"
          disabled={!hasContent || mutation.isPending}
          onClick={() => mutation.mutate({
            visitId: item.visitId,
            chiefComplaint: chiefComplaint || undefined,
            examination: examination || undefined,
            diagnosis: diagnosis || undefined,
            notes: notes || undefined,
            treatmentPlan: treatmentPlan || undefined,
          })}
        >
          {mutation.isPending ? t('pendingDocs.completing') : t('pendingDocs.complete')}
        </button>
      </div>

      {mutation.isError && (
        <p className="field-error">{t('pendingDocs.completeError')}</p>
      )}
    </section>
  )
}

export function PendingDocumentationPage() {
  const auth = useAuth()
  const { t } = useTranslation()
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
        <p className="state error">{t('pendingDocs.denied')}</p>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('pendingDocs.eyebrow')}</p>
          <h1>{t('pendingDocs.title')}</h1>
          <p className="muted">{t('pendingDocs.intro')}</p>
        </div>
        <div className="actions">
          {auth.session?.user.isSuperUser && (
            <label className="inline-toggle">
              <input
                type="checkbox"
                checked={!mineOnly}
                onChange={(event) => setMineOnly(!event.target.checked)}
              />
              <span>{t('pendingDocs.allDoctors')}</span>
            </label>
          )}
          {auth.hasPermission('FollowUp_View') && (
            <Link className="button secondary nav-button" to="/follow-ups">{t('common.followUps')}</Link>
          )}
          <Link className="button secondary nav-button" to="/queue">{t('common.queue')}</Link>
          <Link className="button secondary nav-button" to="/patients">{t('common.patients')}</Link>
        </div>
      </section>

      <section className="panel">
        {query.isLoading && <p className="state">{t('pendingDocs.loading')}</p>}
        {query.isError && <p className="state error">{t('pendingDocs.loadError')}</p>}
        {query.data?.length === 0 && <p className="state">{t('pendingDocs.empty')}</p>}

        {query.data && query.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('pendingDocs.patient')}</th>
                  <th>{t('pendingDocs.doctor')}</th>
                  <th>{t('pendingDocs.visit')}</th>
                  <th>{t('pendingDocs.documentation')}</th>
                  <th>{t('pendingDocs.started')}</th>
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
                    <td>{item.visitStatus}</td>
                    <td>{item.documentationStatus}</td>
                    <td>{new Date(item.entryAtUtc).toLocaleString()}</td>
                    <td>
                      {auth.hasPermission('Visit_Edit') && (
                        <button className="button secondary" onClick={() => setSelected(item)}>
                          {t('pendingDocs.finishNote')}
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
