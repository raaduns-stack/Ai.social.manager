import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import Card from '../ui/Card'
import { cn } from '../../utils/cn'

/**
 * Usage:
 * <StatsCard label="Followers" value="12,480" change={4.2} />
 * change: positive number = growth (green), negative = decline (red)
 */
export default function StatsCard({ label, value, change, icon }) {
  const isPositive = change >= 0

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-ink-muted">{label}</p>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {change !== undefined && (
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-xs font-medium',
            isPositive ? 'text-accent-600' : 'text-danger'
          )}
        >
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(change)}%
        </div>
      )}
    </Card>
  )
}
