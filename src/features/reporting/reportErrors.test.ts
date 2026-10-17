import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { isReportTooLarge, reportErrorMessage } from './reportErrors'

function errorWithStatus(status: number) {
  return new AxiosError('request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    data: { status: false, error: 'report_too_large' },
    status,
    statusText: 'Rejected',
    headers: {},
    config: { headers: new AxiosHeaders() },
  })
}

describe('report size feedback', () => {
  it('recognizes 413 rejection and tells users how to narrow filters', () => {
    const error = errorWithStatus(413)
    expect(isReportTooLarge(error)).toBe(true)
    expect(reportErrorMessage(error, 'retry')).toContain('10,000 rows')
    expect(reportErrorMessage(error, 'retry')).toContain('Narrow')
  })

  it('does not mistake permission and network errors for oversized reports', () => {
    expect(isReportTooLarge(errorWithStatus(403))).toBe(false)
    expect(reportErrorMessage(errorWithStatus(403), 'Unavailable')).toBe('Unavailable')
    expect(isReportTooLarge(new Error('Network offline'))).toBe(false)
  })
})
