import { describe, expect, it } from 'vitest'
import { isSameSession, SessionChangedError } from './sessionGuards'

describe('refresh session ownership', () => {
  it('recognizes only the exact refresh token generation', () => {
    expect(isSameSession({ refreshToken: 'original' }, 'original')).toBe(true)
    expect(isSameSession({ refreshToken: 'replacement' }, 'original')).toBe(false)
    expect(isSameSession(null, 'original')).toBe(false)
  })

  it('returns a typed error when an in-flight refresh loses ownership', () => {
    const error = new SessionChangedError()
    expect(error.name).toBe('SessionChangedError')
    expect(error.message).toContain('Session changed')
  })
})
