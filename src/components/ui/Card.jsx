import { cn } from '../../utils/cn'

/**
 * Base card used everywhere: stats cards, plan cards, list items, etc.
 * Usage: <Card className="p-6">...</Card>
 */
export default function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface shadow-soft',
        hover && 'transition-shadow hover:shadow-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
