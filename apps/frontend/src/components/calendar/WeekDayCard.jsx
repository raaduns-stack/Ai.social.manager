import { Calendar } from 'lucide-react'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { cn } from '../../utils/cn'

/**
 * WeekDayCard represents one day in a 7-day weekly calendar view.
 * 
 * Usage:
 * <WeekDayCard
 *   dayLabel="Monday"
 *   date="Jul 27"
 *   isToday={true}
 *   customers={[
 *     { id: "u1", businessName: "TechNova Ltd", avatarUrl: "", postCount: 3 },
 *     { id: "u2", businessName: "John Clothing", avatarUrl: "", postCount: 1 }
 *   ]}
 *   maxVisible={6}
 *   onCustomerClick={(id) => console.log(id)}
 *   onViewAllClick={() => console.log('view all')}
 * />
 */
export default function WeekDayCard({
  dayLabel,
  date,
  isToday = false,
  customers = [],
  maxVisible = 6,
  onCustomerClick,
  onViewAllClick,
}) {
  const visibleCustomers = customers.slice(0, maxVisible)
  const hasMore = customers.length > maxVisible

  return (
    <Card
      className={cn(
        'p-4 flex flex-col gap-4 h-full min-h-[280px]',
        isToday && 'border-t-4 border-t-primary'
      )}
      hover
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="min-w-0">
          <h3 className="font-bold text-ink leading-tight">{dayLabel}</h3>
          <p className="text-xs text-ink-muted mt-0.5">{date}</p>
        </div>
        {isToday && (
          <Badge tone="primary" className="shrink-0 text-[10px] font-bold">
            Today
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between gap-4">
        {customers.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<Calendar size={24} className="text-ink-muted" />}
              title="No content scheduled"
              className="py-6 px-4 w-full border-dashed"
            />
          </div>
        ) : (
          <div className="space-y-1.5 flex-1">
            {visibleCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onCustomerClick?.(customer.id)}
                onKeyDown={(e) => {
                  if (onCustomerClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onCustomerClick(customer.id)
                  }
                }}
                tabIndex={onCustomerClick ? 0 : undefined}
                role={onCustomerClick ? 'button' : undefined}
                className={cn(
                  'flex items-center justify-between p-1.5 rounded-control transition-colors select-none group focus:outline-none focus:ring-1 focus:ring-primary/20',
                  onCustomerClick && 'cursor-pointer hover:bg-canvas'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={customer.businessName} src={customer.avatarUrl} size={28} />
                  <span className="text-sm font-medium text-ink truncate group-hover:text-primary transition-colors">
                    {customer.businessName}
                  </span>
                </div>
                <Badge tone="neutral" className="shrink-0 text-[10px]">
                  {customer.postCount} {customer.postCount === 1 ? 'post' : 'posts'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Footer Action */}
        {hasMore && (
          <div className="pt-2 border-t border-border/40 flex justify-center shrink-0">
            <button
              onClick={onViewAllClick}
              className="text-xs font-semibold text-primary hover:text-primary-700 transition-colors focus:outline-none focus:underline"
            >
              View All ({customers.length})
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
