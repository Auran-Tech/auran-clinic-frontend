import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { login } from './api'
import { useAuth } from './AuthContext'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
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
      <section className="auth-card">
        <p className="eyebrow">Auran Clinic</p>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to continue to your clinic workspace.</p>

        <form className="auth-form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <label>
            <span>Email</span>
            <input type="email" autoComplete="username" {...form.register('email')} />
            {form.formState.errors.email && (
              <small className="field-error">{form.formState.errors.email.message}</small>
            )}
          </label>

          <label>
            <span>Password</span>
            <input type="password" autoComplete="current-password" {...form.register('password')} />
            {form.formState.errors.password && (
              <small className="field-error">{form.formState.errors.password.message}</small>
            )}
          </label>

          {mutation.isError && (
            <p className="field-error">Invalid credentials or inactive clinic account.</p>
          )}

          <button className="button primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
