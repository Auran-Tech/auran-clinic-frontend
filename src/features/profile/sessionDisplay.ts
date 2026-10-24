export function formatSessionDate(value: string, locale: string): string | null {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 2000) {
    return null
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
