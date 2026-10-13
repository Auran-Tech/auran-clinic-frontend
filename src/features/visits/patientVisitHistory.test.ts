import { describe, expect, it } from 'vitest'

function clampPreviousPage(page: number) {
  return Math.max(1, page - 1)
}

describe('patient visit history paging', () => {
  it('never pages below one', () => {
    expect(clampPreviousPage(1)).toBe(1)
  })

  it('moves to a newer page when available', () => {
    expect(clampPreviousPage(3)).toBe(2)
  })
})
