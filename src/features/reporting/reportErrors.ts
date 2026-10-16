import { isAxiosError } from 'axios'

/** Standard server-side size guard response, shared by preview and downloads. */
export function isReportTooLarge(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 413
}

export function reportErrorMessage(error: unknown, fallback: string): string {
  return isReportTooLarge(error)
    ? 'Report exceeds 10,000 visits. Narrow the date range or other filters and try again.'
    : fallback
}
