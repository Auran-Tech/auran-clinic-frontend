export type ConnectionPhase = 'checking' | 'connected' | 'retrying' | 'disconnected'

export interface ConnectionSnapshot {
  phase: ConnectionPhase
  seconds: number
}

interface ConnectionOptions {
  retryDelaySeconds?: number
  maxRetries?: number
  pollMs?: number
}

export class ConnectionMonitor {
  private snapshot: ConnectionSnapshot = { phase: 'checking', seconds: 0 }
  private listeners = new Set<() => void>()
  private timer: ReturnType<typeof setTimeout> | undefined
  private active = false
  private inFlight = false
  private generation = 0
  private failures = 0
  private readonly retryDelaySeconds: number
  private readonly maxRetries: number
  private readonly pollMs: number

  constructor(private readonly probe: () => Promise<boolean>, options: ConnectionOptions = {}) {
    this.retryDelaySeconds = options.retryDelaySeconds ?? 3
    this.maxRetries = options.maxRetries ?? 3
    this.pollMs = options.pollMs ?? 15_000
  }

  getSnapshot = () => this.snapshot
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  start() {
    if (this.active) return
    this.active = true
    this.failures = 0
    this.update('checking', 0)
    void this.check()
  }

  stop() {
    this.active = false
    this.generation += 1
    this.inFlight = false
    this.clearTimer()
  }

  retryNow = () => {
    if (!this.active || this.inFlight) return
    this.failures = 0
    this.clearTimer()
    this.update('checking', 0)
    void this.check()
  }

  checkAfterRequestFailure = () => {
    if (this.active && this.snapshot.phase === 'connected') void this.check()
  }

  private update(phase: ConnectionPhase, seconds: number) {
    if (this.snapshot.phase === phase && this.snapshot.seconds === seconds) return
    this.snapshot = { phase, seconds }
    this.listeners.forEach(listener => listener())
  }

  private clearTimer() {
    if (this.timer !== undefined) clearTimeout(this.timer)
    this.timer = undefined
  }

  private schedulePoll() {
    this.clearTimer()
    this.timer = setTimeout(() => { void this.check() }, this.pollMs)
  }

  private scheduleRetry() {
    this.update('retrying', this.retryDelaySeconds)
    const tick = () => {
      if (!this.active) return
      if (this.snapshot.seconds <= 1) {
        this.clearTimer()
        void this.check()
      } else {
        this.update('retrying', this.snapshot.seconds - 1)
        this.timer = setTimeout(tick, 1_000)
      }
    }
    this.timer = setTimeout(tick, 1_000)
  }

  private async check() {
    if (!this.active || this.inFlight) return
    this.clearTimer()
    this.inFlight = true
    const generation = this.generation
    let ready = false
    try { ready = await this.probe() } catch { /* Failed readiness checks are disconnected. */ }
    if (!this.active || generation !== this.generation) return
    this.inFlight = false
    if (ready) {
      this.failures = 0
      this.update('connected', 0)
      this.schedulePoll()
    } else if (this.snapshot.phase === 'disconnected') {
      this.schedulePoll()
    } else if (this.failures < this.maxRetries) {
      this.failures += 1
      this.scheduleRetry()
    } else {
      this.update('disconnected', 0)
      this.schedulePoll()
    }
  }
}
