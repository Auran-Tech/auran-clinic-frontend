import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  changePassword,
  getOwnSessions,
  revokeAllOwnSessions,
  revokeOwnSession,
  type OwnSession,
} from './api'
import { formatSessionDate } from './sessionDisplay'

type SecurityDialog = 'password' | 'sessions' | null

export function ProfileSecurity() {
  const { t, i18n } = useTranslation('profile')
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<SecurityDialog>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false)

  const sessions = useQuery({
    queryKey: ['profile-sessions'],
    queryFn: getOwnSessions,
    enabled: dialog === 'sessions',
  })

  const passwordChange = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      auth.endSession()
      navigate('/login', { replace: true })
    },
  })

  const sessionRevocation = useMutation({
    mutationFn: revokeOwnSession,
    onSuccess: async (_, sessionId) => {
      const wasCurrent = sessions.data?.some(
        (session) => session.id === sessionId && session.isCurrent,
      )
      if (wasCurrent) {
        auth.endSession()
        navigate('/login', { replace: true })
        return
      }
      await queryClient.invalidateQueries({ queryKey: ['profile-sessions'] })
    },
  })

  const allSessionsRevocation = useMutation({
    mutationFn: revokeAllOwnSessions,
    onSuccess: () => {
      auth.endSession()
      navigate('/login', { replace: true })
    },
  })

  const orderedSessions = [...(sessions.data ?? [])].sort(
    (first, second) => Number(second.isCurrent) - Number(first.isCurrent),
  )
  const visibleSessions = showAllSessions ? orderedSessions : orderedSessions.slice(0, 8)

  function closeDialog() {
    setDialog(null)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setFormError('')
    setShowAllSessions(false)
    setConfirmRevokeAll(false)
    passwordChange.reset()
    sessionRevocation.reset()
    allSessionsRevocation.reset()
  }

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (newPassword !== confirmPassword) {
      setFormError(t('passwordMismatch'))
      return
    }
    passwordChange.mutate()
  }

  function sessionLabel(session: OwnSession) {
    const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-US'
    const signedIn = formatSessionDate(session.createdDate, locale)
    const expires = formatSessionDate(session.expiresDate, locale)
    return {
      signedIn: signedIn ?? t('signInDateUnavailable'),
      expires,
    }
  }

  return (
    <section className="panel profile-security">
      <h2>{t('security')}</h2>
      <div className="profile-security-row">
        <div>
          <strong>{t('password')}</strong>
          <p className="muted">{t('passwordHint')}</p>
        </div>
        <button
          className="button secondary"
          type="button"
          onClick={() => setDialog('password')}
        >
          {t('change')}
        </button>
      </div>
      <div className="profile-security-row">
        <div>
          <strong>{t('activeSessions')}</strong>
          <p className="muted">{t('sessionsHint')}</p>
        </div>
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            setShowAllSessions(false)
            setConfirmRevokeAll(false)
            setDialog('sessions')
          }}
        >
          {t('manage')}
        </button>
      </div>

      {dialog && (
        <div
          className="profile-dialog-backdrop"
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeDialog()
          }}
        >
          <section
            aria-label={dialog === 'password' ? t('changePassword') : t('activeSessions')}
            aria-modal="true"
            className="profile-dialog"
            role="dialog"
          >
            <div className="profile-dialog-heading">
              <h2>{dialog === 'password' ? t('changePassword') : t('activeSessions')}</h2>
              <button
                aria-label={t('close')}
                className="profile-dialog-close"
                type="button"
                onClick={closeDialog}
              >
                ×
              </button>
            </div>

            {dialog === 'password' ? (
              <form onSubmit={submitPassword}>
                <label>
                  <span>{t('currentPassword')}</span>
                  <input
                    autoFocus
                    autoComplete="current-password"
                    required
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </label>
                <label>
                  <span>{t('newPassword')}</span>
                  <input
                    autoComplete="new-password"
                    minLength={8}
                    required
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>
                <label>
                  <span>{t('confirmPassword')}</span>
                  <input
                    autoComplete="new-password"
                    minLength={8}
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>
                {(formError || passwordChange.isError) && (
                  <p className="profile-error" role="alert">
                    {formError || t('passwordError')}
                  </p>
                )}
                <p className="muted">{t('passwordSignInAgain')}</p>
                <div className="actions profile-actions">
                  <button
                    className="button secondary"
                    type="button"
                    onClick={closeDialog}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    className="button primary"
                    disabled={passwordChange.isPending}
                    type="submit"
                  >
                    {t('changePassword')}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {sessions.isLoading && <p>{t('loadingSessions')}</p>}
                {sessions.isError && (
                  <p className="profile-error">{t('sessionsError')}</p>
                )}
                {sessions.data && (
                  <div className="profile-session-toolbar">
                    <span>{t('sessionCount', { count: sessions.data.length })}</span>
                    {sessions.data.length > 0 && (
                      <button
                        className="button secondary"
                        disabled={allSessionsRevocation.isPending}
                        type="button"
                        onClick={() => setConfirmRevokeAll(true)}
                      >
                        {t('revokeAll')}
                      </button>
                    )}
                  </div>
                )}
                {confirmRevokeAll && (
                  <div
                    aria-label={t('revokeAll')}
                    className="profile-session-confirm"
                    role="group"
                  >
                    <strong>{t('revokeAllConfirm')}</strong>
                    <p>{t('revokeAllHint')}</p>
                    <div className="actions profile-actions">
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => setConfirmRevokeAll(false)}
                      >
                        {t('cancel')}
                      </button>
                      <button
                        className="button primary"
                        disabled={allSessionsRevocation.isPending}
                        type="button"
                        onClick={() => allSessionsRevocation.mutate()}
                      >
                        {t('revokeAllAndSignOut')}
                      </button>
                    </div>
                  </div>
                )}
                {visibleSessions.map((session) => {
                  const dates = sessionLabel(session)
                  return (
                    <div className="profile-session" key={session.id}>
                      <div>
                        <strong>
                          {session.isCurrent ? t('currentSession') : t('session')}
                        </strong>
                        <small>{t('signedIn', { date: dates.signedIn })}</small>
                        {dates.expires && (
                          <small>{t('expires', { date: dates.expires })}</small>
                        )}
                      </div>
                      <button
                        className="button secondary"
                        disabled={
                          sessionRevocation.isPending || allSessionsRevocation.isPending
                        }
                        type="button"
                        onClick={() => sessionRevocation.mutate(session.id)}
                      >
                        {t('revoke')}
                      </button>
                    </div>
                  )
                })}
                {!showAllSessions && orderedSessions.length > 8 && (
                  <button
                    className="button secondary profile-show-sessions"
                    type="button"
                    onClick={() => setShowAllSessions(true)}
                  >
                    {t('showRemaining', { count: orderedSessions.length - 8 })}
                  </button>
                )}
                {sessionRevocation.isError && (
                  <p className="profile-error" role="alert">
                    {t('revokeError')}
                  </p>
                )}
                {allSessionsRevocation.isError && (
                  <p className="profile-error" role="alert">
                    {t('revokeAllError')}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
