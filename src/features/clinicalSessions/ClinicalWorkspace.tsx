import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { ClinicalOrderEditor } from '../clinicalOrders/ClinicalOrderEditor'
import { ClinicalOrderAttachmentsPanel } from '../clinicalOrderAttachments/ClinicalOrderAttachmentsPanel'
import { ClinicalMeasurementsPanel } from '../clinicalMeasurements/ClinicalMeasurementsPanel'
import { FollowUpCreatePanel } from '../followUps/FollowUpCreatePanel'
import {
  endClinicalSession,
  getActiveClinicalSession,
  saveClinicalDocumentation,
  startClinicalSession,
} from './api'

interface ClinicalWorkspaceProps {
  visitId: string
}

export function ClinicalWorkspace({ visitId }: ClinicalWorkspaceProps) {
  const auth = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const canEdit = auth.hasPermission('Visit_Edit')

  const sessionQuery = useQuery({
    queryKey: ['clinical-session', visitId],
    queryFn: () => getActiveClinicalSession(visitId),
    enabled: auth.hasPermission('Visit_View'),
  })

  const [chiefComplaint, setChiefComplaint] = useState('')
  const [examination, setExamination] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')

  useEffect(() => {
    const session = sessionQuery.data
    if (!session) return
    setChiefComplaint(session.chiefComplaint ?? '')
    setExamination(session.examination ?? '')
    setDiagnosis(session.diagnosis ?? '')
    setNotes(session.notes ?? '')
    setTreatmentPlan(session.treatmentPlan ?? '')
  }, [sessionQuery.data])

  const startMutation = useMutation({
    mutationFn: () => startClinicalSession(visitId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clinical-session', visitId] })
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => saveClinicalDocumentation({
      visitId,
      chiefComplaint: chiefComplaint || undefined,
      examination: examination || undefined,
      diagnosis: diagnosis || undefined,
      notes: notes || undefined,
      treatmentPlan: treatmentPlan || undefined,
    }),
    onSuccess: (session) => {
      queryClient.setQueryData(['clinical-session', visitId], session)
    },
  })

  const endMutation = useMutation({
    mutationFn: () => endClinicalSession(visitId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clinical-session', visitId] })
      await queryClient.invalidateQueries({ queryKey: ['active-visit'] })
    },
  })

  if (!auth.hasPermission('Visit_View')) {
    return null
  }

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t('clinicalWorkspace.title')}</h2>
            <p className="muted">{t('clinicalWorkspace.intro')}</p>
          </div>
        </div>

        {sessionQuery.isLoading && (
          <p className="state">{t('clinicalWorkspace.loading')}</p>
        )}

        {!sessionQuery.isLoading && !sessionQuery.data && (
          <div className="clinical-empty">
            <p className="muted">{t('clinicalWorkspace.noActive')}</p>
            {canEdit && (
              <button
                className="button primary"
                disabled={startMutation.isPending}
                onClick={() => startMutation.mutate()}
              >
                {startMutation.isPending
                  ? t('clinicalWorkspace.starting')
                  : t('clinicalWorkspace.start')}
              </button>
            )}
            {startMutation.isError && (
              <p className="field-error">{t('clinicalWorkspace.startError')}</p>
            )}
          </div>
        )}

        {sessionQuery.data && (
          <>
            <div className="visit-status-card clinical-session-meta">
              <div>
                <span className="profile-label">{t('clinicalWorkspace.sessionStarted')}</span>
                <strong>{new Date(sessionQuery.data.startedAtUtc).toLocaleString()}</strong>
              </div>
              <div>
                <span className="profile-label">{t('common.documentation')}</span>
                <strong>{sessionQuery.data.documentationStatus}</strong>
              </div>
            </div>

            <div className="clinical-form">
              <label>
                <span>{t('clinicalWorkspace.chiefComplaint')}</span>
                <textarea
                  rows={3}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  disabled={!canEdit}
                />
              </label>
              <label>
                <span>{t('clinicalWorkspace.examination')}</span>
                <textarea
                  rows={4}
                  value={examination}
                  onChange={(e) => setExamination(e.target.value)}
                  disabled={!canEdit}
                />
              </label>
              <label>
                <span>{t('clinicalWorkspace.diagnosis')}</span>
                <textarea
                  rows={4}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  disabled={!canEdit}
                />
              </label>
              <label>
                <span>{t('clinicalWorkspace.treatmentPlan')}</span>
                <textarea
                  rows={4}
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  disabled={!canEdit}
                />
              </label>
              <label className="full-width">
                <span>{t('clinicalWorkspace.notes')}</span>
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!canEdit}
                />
              </label>
            </div>

            {canEdit && (
              <div className="actions clinical-actions">
                <button
                  className="button secondary"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending
                    ? t('clinicalWorkspace.saving')
                    : t('clinicalWorkspace.saveDraft')}
                </button>
                <button
                  className="button primary"
                  disabled={endMutation.isPending}
                  onClick={() => endMutation.mutate()}
                >
                  {endMutation.isPending
                    ? t('clinicalWorkspace.ending')
                    : t('clinicalWorkspace.endSession')}
                </button>
              </div>
            )}

            {(saveMutation.isError || endMutation.isError) && (
              <p className="field-error">{t('clinicalWorkspace.updateError')}</p>
            )}
          </>
        )}
      </section>
      <ClinicalMeasurementsPanel visitId={visitId} />
      <ClinicalOrderEditor visitId={visitId} />
      <ClinicalOrderAttachmentsPanel visitId={visitId} />
      <FollowUpCreatePanel visitId={visitId} />
    </>
  )
}
