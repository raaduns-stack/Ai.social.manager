import { cn } from '../../utils/cn'

/**
 * Usage:
 * <EmptyState
 *   icon={<Inbox size={32} />}
 *   title="No posts yet"
 *   description="Connect an account to start scheduling content."
 *   action={<Button>Connect account</Button>}
 * />
 */
export default function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border p-10 text-center',
        className
      )}
    >
      {icon && <div className="text-ink-muted">{icon}</div>}
      <div>
        <p className="font-medium text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
