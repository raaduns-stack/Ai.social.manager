import { cn } from '../../utils/cn'

const tones = {
  neutral: 'bg-gray-100 text-ink-muted',
  success: 'bg-accent-50 text-accent-600',
  warning: 'bg-amber-50 text-warning',
  danger: 'bg-red-50 text-danger',
  primary: 'bg-primary-50 text-primary-700',
}

/**
 * Usage: <Badge tone="success">Connected</Badge>
 * Tones: neutral | success | warning | danger | primary
 */
export default function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
