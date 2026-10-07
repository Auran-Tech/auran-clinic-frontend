import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { logout as logoutRequest } from './api'
import { clearSession, readSession, writeSession } from './storage'
import type { AuthSession } from './types'

interface AuthContextValue {
  session: AuthSession | null
  setSession: (session: AuthSession) => void
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [sessionState, setSessionState] = useState<AuthSession | null>(() => readSession())

  const setSession = useCallback((session: AuthSession) => {
    writeSession(session)
    setSessionState(session)
  }, [])

  const signOut = useCallback(async () => {
    const refreshToken = sessionState?.refreshToken
    try {
      if (refreshToken) {
        await logoutRequest(refreshToken)
      }
    } finally {
      clearSession()
      setSessionState(null)
    }
  }, [sessionState?.refreshToken])

  useEffect(() => {
    const handleExpired = () => {
      clearSession()
      setSessionState(null)
    }
    window.addEventListener('auran:session-expired', handleExpired)
    return () => window.removeEventListener('auran:session-expired', handleExpired)
  }, [])

  const hasPermission = useCallback(
    (permission: string) =>
      Boolean(sessionState?.user.isSuperUser || sessionState?.user.permissions.includes(permission)),
    [sessionState],
  )

  const value = useMemo<AuthContextValue>(() => ({
    session: sessionState,
    setSession,
    signOut,
    hasPermission,
  }), [sessionState, setSession, signOut, hasPermission])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }
  return value
}
