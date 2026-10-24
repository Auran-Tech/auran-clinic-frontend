import { useTranslation } from 'react-i18next'
import type { DashboardSummary } from '../reporting/types'

interface Props {
  visits: DashboardSummary['weeklyVisits']
}

export function DashboardTrendChart({ visits }: Props) {
  const { t, i18n } = useTranslation('dashboard')
  const counts = visits.map((day) => day.count)
  const max = Math.max(1, ...counts)
  const left = 12
  const right = 588
  const top = 18
  const bottom = 160
  const points = counts.map((count, index) => ({
    x: left + (index * (right - left)) / Math.max(1, counts.length - 1),
    y: bottom - (count / max) * (bottom - top),
  }))

  const line = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const middle = (previous.x + point.x) / 2
    return `${path} C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`
  }, '')
  const area = points.length
    ? `${line} L ${points.at(-1)!.x} ${bottom} L ${points[0].x} ${bottom} Z`
    : ''
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-US'

  return (
    <div className="dashboard-trend">
      <svg
        aria-label={t('visitsChartDescription')}
        className="dashboard-trend-graphic"
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 600 180"
      >
        <defs>
          <linearGradient id="dashboard-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[35, 85, 135].map((position) => (
          <line
            className="dashboard-trend-gridline"
            key={position}
            x1={left}
            x2={right}
            y1={position}
            y2={position}
          />
        ))}
        {points.length > 0 && (
          <>
            <path d={area} fill="url(#dashboard-trend-fill)" />
            <path className="dashboard-trend-line" d={line} />
            {points.map((point, index) => (
              <circle
                className="dashboard-trend-point"
                cx={point.x}
                cy={point.y}
                key={visits[index].localDate}
                r="4"
              >
                <title>{`${visits[index].localDate}: ${visits[index].count}`}</title>
              </circle>
            ))}
          </>
        )}
      </svg>
      <div className="dashboard-trend-labels">
        {visits.map((day) => (
          <span key={day.localDate}>
            {new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
              new Date(`${day.localDate}T12:00:00`),
            )}
          </span>
        ))}
      </div>
      {counts.every((count) => count === 0) && (
        <p className="dashboard-trend-empty">{t('noVisitsThisWeek')}</p>
      )}
    </div>
  )
}
