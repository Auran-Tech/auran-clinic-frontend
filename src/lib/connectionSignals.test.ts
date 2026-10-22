import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { isTransientConnectionFailure } from './connectionSignals'

describe('connection failure classification', () => {
  it('treats request timeouts and gateway timeouts as connection failures', () => {
    const timedOutRequest = new AxiosError('timeout', 'ECONNABORTED')
    const requestTimeout = new AxiosError(
      'Request Timeout',
      undefined,
      undefined,
      undefined,
      {
        status: 408,
      } as never,
    )
    const gatewayTimeout = new AxiosError(
      'Gateway Timeout',
      undefined,
      undefined,
      undefined,
      {
        status: 504,
      } as never,
    )
    const tunnelTimeout = new AxiosError(
      'Tunnel Timeout',
      undefined,
      undefined,
      undefined,
      {
        status: 524,
      } as never,
    )

    expect(isTransientConnectionFailure(timedOutRequest)).toBe(true)
    expect(isTransientConnectionFailure(requestTimeout)).toBe(true)
    expect(isTransientConnectionFailure(gatewayTimeout)).toBe(true)
    expect(isTransientConnectionFailure(tunnelTimeout)).toBe(true)
  })

  it('does not mask authentication or deliberate cancellation as disconnects', () => {
    const unauthorized = new AxiosError('Unauthorized', undefined, undefined, undefined, {
      status: 401,
    } as never)
    const canceled = new AxiosError('Canceled', 'ERR_CANCELED')

    expect(isTransientConnectionFailure(unauthorized)).toBe(false)
    expect(isTransientConnectionFailure(canceled)).toBe(false)
  })
})
