import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { createFollowUp } from './api'

export function FollowUpCreatePanel({ visitId }: { visitId: string }) {
  const auth = useAuth()
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
          <h2>Follow-up recommendation</h2>
          <p className="muted">Schedule the patient's next review after this visit.</p>
        </div>
      </div>

      <div className="follow-up-create">
        <label className="full-width">
          <span>Recommendation</span>
          <textarea
            rows={3}
            value={recommendation}
            onChange={(event) => setRecommendation(event.target.value)}
            placeholder="What should be reviewed at follow-up?"
          />
        </label>

        <label>
          <span>Recommended date</span>
          <input
            type="date"
            value={recommendedDate}
            onChange={(event) => setRecommendedDate(event.target.value)}
          />
        </label>

        <label>
          <span>Or after days</span>
          <input
            type="number"
            min="1"
            value={afterDays}
            onChange={(event) => setAfterDays(event.target.value)}
            placeholder="e.g. 7"
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
            {mutation.isPending ? 'Scheduling…' : 'Schedule follow-up'}
          </button>
        </div>

        {mutation.isError && (
          <p className="field-error full-width">Unable to schedule follow-up.</p>
        )}
      </div>
    </section>
  )
}
