import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import Card from './Card'
import { cn } from '../../utils/cn'

/**
 * Usage:
 * <StatsCard label="Expired" value={24} tone="error" icon="AlertTriangle" />
 * <StatsCard label="Followers" value="12,480" change={4.2} />
 */
export default function StatsCard({
  label,
  value,
  change,
  icon,
  tone = 'default',
  onClick,
}) {
  const isPositive = change >= 0

  // Resolve icon string to a React component/element if necessary
  const renderIcon = () => {
    if (!icon) return null
    if (typeof icon === 'string') {
      const LucideIcon = Icons[icon]
      if (LucideIcon) {
        return <LucideIcon size={20} />
      }
      return null
    }
    return icon
  }

  const iconAccentColor = {
    default: 'text-primary-600',
    warning: 'text-warning',
    error: 'text-danger',
  }[tone]

  const borderClass = {
    default: '',
    warning: 'border-l-4 border-l-warning',
    error: 'border-l-4 border-l-danger',
  }[tone]

  const handleClick = (e) => {
    if (onClick) {
      onClick(e)
    }
  }

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick(e)
    }
  }

  return (
    <Card
      className={cn(
        'p-5 transition-all duration-200',
        borderClass,
        onClick && 'cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary/20'
      )}
      hover={!!onClick}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-ink-muted">{label}</p>
        {icon && <div className={iconAccentColor}>{renderIcon()}</div>}
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
