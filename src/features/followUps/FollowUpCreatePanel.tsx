import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { createFollowUp } from './api'

export function FollowUpCreatePanel({ visitId }: { visitId: string }) {
  const auth = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [recommendation, setRecommendation] = useState('')
  const [recommendedDate, setRecommendedDate] = useState('')
  const [afterDays, setAfterDays] = useState('')

  const mutation = useMutation({
    mutationFn: createFollowUp,
    onSuccess: async () => {
      setRecommendation('')
      setRecommendedDate('')
      setAfterDays('')
      await queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
    },
  })

  if (!auth.hasPermission('FollowUp_Manage')) return null

  const days = afterDays ? Number(afterDays) : undefined
  const canSubmit = Boolean(
    recommendation.trim() &&
      (recommendedDate || (days && Number.isFinite(days) && days > 0)),
  )

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t('followUps.createTitle')}</h2>
          <p className="muted">{t('followUps.createIntro')}</p>
        </div>
      </div>

      <div className="follow-up-create">
        <label className="full-width">
          <span>{t('followUps.recommendation')}</span>
          <textarea
            rows={3}
            value={recommendation}
            onChange={(event) => setRecommendation(event.target.value)}
            placeholder={t('followUps.createPlaceholder')}
          />
        </label>

        <label>
          <span>{t('followUps.recommendedDate')}</span>
          <input
            type="date"
            value={recommendedDate}
            onChange={(event) => setRecommendedDate(event.target.value)}
          />
        </label>

        <label>
          <span>{t('followUps.orAfterDays')}</span>
          <input
            type="number"
            min="1"
            value={afterDays}
            onChange={(event) => setAfterDays(event.target.value)}
            placeholder={t('followUps.daysPlaceholder')}
          />
        </label>

        <div className="actions full-width">
          <button
            className="button primary"
            disabled={!canSubmit || mutation.isPending}
            onClick={() => mutation.mutate({
              visitId,
              recommendation: recommendation.trim(),
              recommendedDate: recommendedDate || undefined,
              recommendedAfterDays: days,
            })}
          >
            {mutation.isPending ? t('followUps.scheduling') : t('followUps.schedule')}
          </button>
        </div>

        {mutation.isError && (
          <p className="field-error full-width">{t('followUps.scheduleError')}</p>
        )}
      </div>
    </section>
  )
}
