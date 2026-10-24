import './QueueKpiCard.css'
import type { LucideIcon } from 'lucide-react'

interface QueueKpiCardProps {
  label: string
  value: number | string
  detail: string
  icon: LucideIcon
  tone: 'blue' | 'amber' | 'violet' | 'teal'
}

export function QueueKpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: QueueKpiCardProps) {
  return (
    <article className={`queue-kpi-card queue-kpi-card-${tone}`}>
      <div className="queue-kpi-heading">
        <small>{label}</small>
        <span className="queue-kpi-icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.8} />
        </span>
      </div>
      <strong>{value}</strong>
      <span className="queue-kpi-detail">{detail}</span>
    </article>
  )
}
