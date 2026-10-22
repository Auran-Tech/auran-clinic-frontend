import './followUps.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { cancelFollowUp, completeFollowUp, getFollowUps } from './api'
import type { FollowUpBucket } from './types'

const buckets: FollowUpBucket[] = ['Today', 'Upcoming', 'Overdue', 'Completed']

export function FollowUpsPage() {
  const { t } = useTranslation('followUps')
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [bucket, setBucket] = useState<FollowUpBucket>('Today')

  const query = useQuery({
    queryKey: ['follow-ups', bucket],
    queryFn: () => getFollowUps(bucket),
    enabled: auth.hasPermission('FollowUp_View'),
  })

  const completeMutation = useMutation({
    mutationFn: completeFollowUp,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelFollowUp,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
    },
  })

  if (!auth.hasPermission('FollowUp_View')) {
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
          {(auth.hasPermission('Users_View') || auth.hasPermission('RBAC_View')) && (
            <Link className="button secondary nav-button" to="/employees">
              {t('employees')}
            </Link>
          )}
          <Link className="button secondary nav-button" to="/pending-documentation">
            {t('pendingDocumentation')}
          </Link>
          <Link className="button secondary nav-button" to="/queue">
            {t('liveQueue')}
          </Link>
          <Link className="button secondary nav-button" to="/patients">
            {t('patients')}
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="bucket-tabs" role="tablist" aria-label={t('statusFilter')}>
          {buckets.map((item) => (
            <button
              key={item}
              className={`button ${bucket === item ? 'primary' : 'secondary'}`}
              onClick={() => setBucket(item)}
            >
              {t(item)}
            </button>
          ))}
        </div>

        {query.isLoading && <p className="state">{t('loading')}</p>}
        {query.isError && <p className="state error">{t('loadError')}</p>}
        {query.data?.length === 0 && (
          <p className="state">{t('empty', { bucket: t(bucket) })}</p>
        )}

        {query.data && query.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('patient')}</th>
                  <th>{t('doctor')}</th>
                  <th>{t('recommendation')}</th>
                  <th>{t('recommendedDate')}</th>
                  <th>{t('status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((followUp) => (
                  <tr key={followUp.id}>
                    <td>
                      <Link
                        className="patient-link"
                        to={`/patients/${followUp.patientId}`}
                      >
                        <strong>{followUp.patientName}</strong>
                      </Link>
                      <div className="muted mono">{followUp.patientNumber}</div>
                    </td>
                    <td>{followUp.doctorName}</td>
                    <td>{followUp.recommendation}</td>
                    <td>{followUp.recommendedDate ?? '—'}</td>
                    <td>{t(followUp.status, { defaultValue: followUp.status })}</td>
                    <td>
                      {followUp.status === 'Open' &&
                        auth.hasPermission('FollowUp_Manage') && (
                          <div className="actions">
                            <button
                              className="button secondary"
                              disabled={completeMutation.isPending}
                              onClick={() => completeMutation.mutate(followUp.id)}
                            >
                              {t('complete')}
                            </button>
                            <button
                              className="button danger"
                              disabled={cancelMutation.isPending}
                              onClick={() => cancelMutation.mutate(followUp.id)}
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
