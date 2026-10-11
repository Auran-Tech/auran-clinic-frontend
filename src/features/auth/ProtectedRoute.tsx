import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const auth = useAuth()
  const location = useLocation()

  if (!auth.session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
