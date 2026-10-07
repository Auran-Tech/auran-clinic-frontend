import { describe, expect, it } from 'vitest'

describe('audit metadata formatting', () => {
  it('pretty prints valid JSON metadata', () => {
    const input = '{"patientId":"123","status":"Completed"}'
    expect(JSON.stringify(JSON.parse(input), null, 2)).toContain('"status": "Completed"')
  })

  it('preserves plain text when metadata is not JSON', () => {
    const input = 'not-json'
    let output = input
    try {
      output = JSON.stringify(JSON.parse(input), null, 2)
    } catch {
      output = input
    }
    expect(output).toBe('not-json')
  })
})
