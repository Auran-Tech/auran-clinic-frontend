import './auth.css'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { login } from './api'
import { useAuth } from './AuthContext'
import { loginSchema, type LoginForm } from './schema'

export function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const auth = useAuth()
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      auth.setSession(session)
      navigate('/patients', { replace: true })
    },
  })

  if (auth.session) {
    return <Navigate to="/patients" replace />
  }

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Auran Clinic">
        <div className="auth-story-content">
          <div className="auth-story-brand">
            <span className="brand-mark" aria-hidden="true">
              A
            </span>
            <span>
              <strong>AURAN CLINIC</strong>
              <small>{t('clinicOperatingSystem')}</small>
            </span>
          </div>
          <h2>{t('heroTitle')}</h2>
          <p>{t('heroBody')}</p>
          <div className="auth-journey" aria-label={t('clinicOperatingSystem')}>
            {(
              [
                'journeyArrival',
                'journeyQueue',
                'journeyVisit',
                'journeyFollowUp',
              ] as const
            ).map((step, index) => (
              <span className="auth-journey-step" key={step}>
                <i aria-hidden="true">{index + 1}</i>
                {t(step)}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <span>
            AURAN CLINIC <small>{t('secureAccess')}</small>
          </span>
        </div>
        <h1>{t('welcomeBack')}</h1>
        <p className="muted">{t('continueWork')}</p>

        <form
          className="auth-form"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <label>
            <span>{t('email')}</span>
            <input type="email" autoComplete="username" {...form.register('email')} />
            {form.formState.errors.email && (
              <small className="field-error">{form.formState.errors.email.message}</small>
            )}
          </label>

          <label>
            <span>{t('password')}</span>
            <input
              type="password"
              autoComplete="current-password"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <small className="field-error">
                {form.formState.errors.password.message}
              </small>
            )}
          </label>

          {mutation.isError && (
            <div role="alert">
              <p className="field-error">{t('invalidCredentials')}</p>
              <p className="muted">{t('platformAccess')}</p>
            </div>
          )}

          <button className="button primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('signingIn') : t('signIn')}
          </button>
        </form>
        <div className="auth-other-entry">
          <Link to="/platform">{t('platformAdmin')}</Link>
        </div>
      </section>
    </main>
  )
}
