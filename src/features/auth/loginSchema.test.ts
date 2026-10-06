import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

describe('login validation', () => {
  it('accepts valid credentials', () => {
    expect(schema.safeParse({
      email: 'user@example.com',
      password: 'Password1',
    }).success).toBe(true)
  })

  it('rejects malformed credentials', () => {
    expect(schema.safeParse({
      email: 'not-an-email',
      password: '',
    }).success).toBe(false)
  })
})
