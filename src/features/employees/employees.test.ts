import { describe, expect, it } from 'vitest'

describe('employee role selection', () => {
  it('adds and removes protected role codes', () => {
    const initial = ['DOCTOR']
    const added = initial.includes('NURSE')
      ? initial.filter((role) => role !== 'NURSE')
      : [...initial, 'NURSE']

    expect(added).toEqual(['DOCTOR', 'NURSE'])

    const removed = added.filter((role) => role !== 'DOCTOR')
    expect(removed).toEqual(['NURSE'])
  })
})
