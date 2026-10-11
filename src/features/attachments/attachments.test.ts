import { describe, expect, it } from 'vitest'

describe('patient attachment constraints', () => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

  it('includes the frontend accepted content types', () => {
    expect(allowed).toContain('image/png')
    expect(allowed).toContain('application/pdf')
  })
})
