import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConnectionMonitor } from './ConnectionMonitor'

afterEach(() => {
  vi.useRealTimers()
})

describe('ConnectionMonitor', () => {
  it('retries readiness, then stays disconnected until a probe succeeds', async () => {
    vi.useFakeTimers()
    const probe = vi.fn().mockResolvedValue(false)
    const monitor = new ConnectionMonitor(probe, {
      retryDelaySeconds: 2,
      maxRetries: 2,
      pollMs: 10_000,
    })
    monitor.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(monitor.getSnapshot()).toEqual({ phase: 'retrying', seconds: 2 })

    await vi.advanceTimersByTimeAsync(1_000)
    expect(monitor.getSnapshot()).toEqual({ phase: 'retrying', seconds: 1 })
    await vi.advanceTimersByTimeAsync(3_000)
    expect(monitor.getSnapshot().phase).toBe('disconnected')
    expect(probe).toHaveBeenCalledTimes(3)

    probe.mockResolvedValueOnce(true)
    monitor.retryNow()
    await vi.advanceTimersByTimeAsync(0)
    expect(monitor.getSnapshot().phase).toBe('connected')
    monitor.stop()
  })

  it('checks again after a request failure without changing a healthy screen first', async () => {
    vi.useFakeTimers()
    const probe = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const monitor = new ConnectionMonitor(probe)
    monitor.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(monitor.getSnapshot().phase).toBe('connected')

    monitor.checkAfterRequestFailure()
    await vi.advanceTimersByTimeAsync(0)
    expect(monitor.getSnapshot()).toEqual({ phase: 'retrying', seconds: 3 })
    monitor.stop()
  })

  it('treats a timed-out readiness probe as a failed connection check', async () => {
    vi.useFakeTimers()
    const probe = vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError'))
    const monitor = new ConnectionMonitor(probe, {
      retryDelaySeconds: 1,
      maxRetries: 1,
      pollMs: 10_000,
    })

    monitor.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(monitor.getSnapshot()).toEqual({ phase: 'retrying', seconds: 1 })

    await vi.advanceTimersByTimeAsync(1_000)
    expect(monitor.getSnapshot()).toEqual({ phase: 'disconnected', seconds: 0 })
    monitor.stop()
  })
})
