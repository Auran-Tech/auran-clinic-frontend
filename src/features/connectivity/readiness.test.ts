import { afterEach, describe, expect, it, vi } from 'vitest'
import { probeReadiness } from './readiness'

vi.mock('../../lib/apiConfig', () => ({
  readyUrl: 'http://localhost/health/ready',
}))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('probeReadiness', () => {
  it('resolves as disconnected when the health request stalls past its timeout', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockImplementation(() => new Promise(() => {}))
    vi.stubGlobal('fetch', fetchMock)

    const result = probeReadiness()
    await vi.advanceTimersByTimeAsync(5_000)

    await expect(result).resolves.toBe(false)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)
  })
})
