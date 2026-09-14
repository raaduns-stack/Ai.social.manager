import { cn } from '../../utils/cn'

const tones = {
  neutral: 'bg-gray-100 text-gray-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
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
