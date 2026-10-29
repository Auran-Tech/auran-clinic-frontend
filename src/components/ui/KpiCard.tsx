import './KpiCard.css'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export type KpiTone = 'blue' | 'amber' | 'violet' | 'teal'

interface KpiCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: KpiTone
  detail?: string
  to?: string
  onClick?: () => void
  pressed?: boolean
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  detail,
  to,
  onClick,
  pressed,
}: KpiCardProps) {
  const content = (
    <>
      <div className="auran-kpi-heading">
        <small>{label}</small>
        <span className="auran-kpi-icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.8} />
        </span>
      </div>
      <strong>{value}</strong>
      {detail && <span className="auran-kpi-detail">{detail}</span>}
    </>
  )

  const className = `auran-kpi-card auran-kpi-${tone}`

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        aria-pressed={pressed}
      >
        {content}
      </button>
    )
  }

  return to ? (
    <Link className={className} to={to}>
      {content}
    </Link>
  ) : (
    <article className={className}>{content}</article>
  )
}
