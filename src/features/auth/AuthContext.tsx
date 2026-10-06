import {
  createContext,
  type PropsWithChildren,
  useContext,
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

  const setSession = (session: AuthSession) => {
    writeSession(session)
    setSessionState(session)
  }

  const signOut = async () => {
    const refreshToken = sessionState?.refreshToken
    try {
      if (refreshToken) {
        await logoutRequest(refreshToken)
      }
    } finally {
      clearSession()
      setSessionState(null)
    }
  }

  const value = useMemo<AuthContextValue>(() => ({
    session: sessionState,
    setSession,
    signOut,
    hasPermission: (permission) =>
      Boolean(sessionState?.user.isSuperUser || sessionState?.user.permissions.includes(permission)),
  }), [sessionState])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }
  return value
}
