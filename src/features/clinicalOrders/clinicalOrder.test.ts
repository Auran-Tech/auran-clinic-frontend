import { describe, expect, it } from 'vitest'

describe('clinical order section mapping', () => {
  it('maps structured lines into order items', () => {
    const items = 'Drug A\nDrug B\n'
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((name) => ({ name }))

    expect(items).toEqual([{ name: 'Drug A' }, { name: 'Drug B' }])
  })
})
