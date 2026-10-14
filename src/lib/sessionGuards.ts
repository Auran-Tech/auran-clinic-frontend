import type { AuthSession } from '../features/auth/types'

/** Refresh tokens identify a specific session generation, not just a user. */
export function isSameSession(
  session: Pick<AuthSession, 'refreshToken'> | null,
  expectedRefreshToken: string,
): boolean {
  return Boolean(session && session.refreshToken === expectedRefreshToken)
}

export class SessionChangedError extends Error {
  constructor() {
    super('Session changed while credentials were being refreshed.')
    this.name = 'SessionChangedError'
  }
}
