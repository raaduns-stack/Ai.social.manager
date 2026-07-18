import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Usage: <Loader /> or <Loader size={32} label="Loading posts..." />
 */
export default function Loader({ size = 20, label, className }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-ink-muted', className)}>
      <Loader2 size={size} className="animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
