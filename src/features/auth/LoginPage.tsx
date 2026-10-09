import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { login } from './api'
import { useAuth } from './AuthContext'
import { loginSchema, type LoginForm } from './schema'

export function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
      <section className="auth-card">
        <p className="eyebrow">Auran Clinic</p>
        <h1>{t('auth.welcomeBack')}</h1>
        <p className="muted">{t('auth.intro')}</p>

        <form className="auth-form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <label>
            <span>{t('auth.email')}</span>
            <input type="email" autoComplete="username" {...form.register('email')} />
            {form.formState.errors.email && (
              <small className="field-error">{form.formState.errors.email.message}</small>
            )}
          </label>

          <label>
            <span>{t('auth.password')}</span>
            <input type="password" autoComplete="current-password" {...form.register('password')} />
            {form.formState.errors.password && (
              <small className="field-error">{form.formState.errors.password.message}</small>
            )}
          </label>

          {mutation.isError && (
            <p className="field-error">{t('auth.invalid')}</p>
          )}

          <button className="button primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>
      </section>
    </main>
  )
}
