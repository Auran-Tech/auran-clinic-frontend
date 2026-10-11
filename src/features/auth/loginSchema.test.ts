import { describe, expect, it } from 'vitest'
import { loginSchema } from './schema'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({
      email: 'user@example.com',
      password: 'Password1',
    }).success).toBe(true)
  })

  it('rejects malformed credentials', () => {
    expect(loginSchema.safeParse({
      email: 'not-an-email',
      password: '',
    }).success).toBe(false)
  })
})
