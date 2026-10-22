import { isAxiosError } from 'axios'

export const connectionFailureEvent = 'auran:connection-failed'
export const connectionRestoredEvent = 'auran:connection-restored'

export function isTransientConnectionFailure(error: unknown): boolean {
  if (!isAxiosError(error) || error.code === 'ERR_CANCELED') return false
  const status = error.response?.status
  return (
    status === undefined ||
    status === 408 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 522 ||
    status === 523 ||
    status === 524
  )
}

export function reportConnectionFailure(error: unknown) {
  if (isTransientConnectionFailure(error))
    window.dispatchEvent(new Event(connectionFailureEvent))
}
