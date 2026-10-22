import { describe, expect, it } from 'vitest'
import { requireData } from './requireData'

describe('requireData', () => {
  it('returns present data including empty and falsy values', () => {
    expect(requireData({ status: true, data: [] as string[] }, 'fallback')).toEqual([])
    expect(requireData({ status: true, data: false }, 'fallback')).toBe(false)
    expect(requireData({ status: true, data: 0 }, 'fallback')).toBe(0)
  })

  it('uses the API message or the caller fallback for missing data', () => {
    expect(() => requireData({ status: false, data: null, message: 'Server message' }, 'fallback')).toThrow('Server message')
    expect(() => requireData({ status: false }, 'fallback')).toThrow('fallback')
  })
})
