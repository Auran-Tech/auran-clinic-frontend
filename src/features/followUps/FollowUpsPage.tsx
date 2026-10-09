import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { cancelFollowUp, completeFollowUp, getFollowUps } from './api'
import type { FollowUpBucket } from './types'

const buckets: { value: FollowUpBucket; labelKey: string }[] = [
  { value: 'Today', labelKey: 'followUps.today' },
  { value: 'Upcoming', labelKey: 'followUps.upcoming' },
  { value: 'Overdue', labelKey: 'followUps.overdue' },
  { value: 'Completed', labelKey: 'followUps.completed' },
]

export function FollowUpsPage() {
  const auth = useAuth()
  const { t } = useTranslation()
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
        <p className="state error">{t('followUps.denied')}</p>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('followUps.eyebrow')}</p>
          <h1>{t('followUps.title')}</h1>
          <p className="muted">{t('followUps.intro')}</p>
        </div>
        <div className="actions">
          {(auth.hasPermission('Users_View') || auth.hasPermission('RBAC_View')) && (
            <Link className="button secondary nav-button" to="/employees">{t('common.employees')}</Link>
          )}
          <Link className="button secondary nav-button" to="/pending-documentation">
            {t('common.pendingDocumentation')}
          </Link>
          <Link className="button secondary nav-button" to="/queue">{t('common.queue')}</Link>
          <Link className="button secondary nav-button" to="/patients">{t('common.patients')}</Link>
        </div>
      </section>

      <section className="panel">
        <div className="bucket-tabs" role="tablist" aria-label={t('followUps.statusAria')}>
          {buckets.map((item) => (
            <button
              key={item.value}
              className={`button ${bucket === item.value ? 'primary' : 'secondary'}`}
              onClick={() => setBucket(item.value)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        {query.isLoading && <p className="state">{t('followUps.loading')}</p>}
        {query.isError && <p className="state error">{t('followUps.loadError')}</p>}
        {query.data?.length === 0 && <p className="state">{t('followUps.empty', { bucket: t(`followUps.${bucket.toLowerCase()}`) })}</p>}

        {query.data && query.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('followUps.patient')}</th>
                  <th>{t('followUps.doctor')}</th>
                  <th>{t('followUps.recommendation')}</th>
                  <th>{t('followUps.recommendedDate')}</th>
                  <th>{t('followUps.status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((followUp) => (
                  <tr key={followUp.id}>
                    <td>
                      <Link className="patient-link" to={`/patients/${followUp.patientId}`}>
                        <strong>{followUp.patientName}</strong>
                      </Link>
                      <div className="muted mono">{followUp.patientNumber}</div>
                    </td>
                    <td>{followUp.doctorName}</td>
                    <td>{followUp.recommendation}</td>
                    <td>{followUp.recommendedDate ?? '—'}</td>
                    <td>{followUp.status}</td>
                    <td>
                      {followUp.status === 'Open' && auth.hasPermission('FollowUp_Manage') && (
                        <div className="actions">
                          <button
                            className="button secondary"
                            disabled={completeMutation.isPending}
                            onClick={() => completeMutation.mutate(followUp.id)}
                          >
                            {t('followUps.complete')}
                          </button>
                          <button
                            className="button danger"
                            disabled={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(followUp.id)}
                          >
                            {t('followUps.cancel')}
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
