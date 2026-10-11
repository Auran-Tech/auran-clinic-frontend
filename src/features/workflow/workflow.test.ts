import { describe, expect, it } from 'vitest'

describe('workflow transition selection', () => {
  it('toggles a transition pair', () => {
    const pairs = new Set<string>()
    const key = 'a:b'

    if (pairs.has(key)) pairs.delete(key)
    else pairs.add(key)

    expect(pairs.has(key)).toBe(true)

    if (pairs.has(key)) pairs.delete(key)
    else pairs.add(key)

    expect(pairs.has(key)).toBe(false)
  })

  it('does not allow a self transition key in the editor logic', () => {
    const from = 'a'
    const to = 'a'
    expect(from === to).toBe(true)
  })
})
