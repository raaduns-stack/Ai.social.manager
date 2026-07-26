import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { cn } from '../../utils/cn'

/**
 * ViewAllCustomersModal displays all customers scheduled for a day in a scrollable list.
 * Supports quick client-side search by business name.
 * 
 * Usage:
 * <ViewAllCustomersModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   dayLabel="Monday"
 *   customers={customers}
 *   onCustomerClick={(id) => console.log(id)}
 * />
 */
export default function ViewAllCustomersModal({
  isOpen,
  onClose,
  dayLabel,
  customers = [],
  onCustomerClick,
}) {
  const [search, setSearch] = useState('')

  // Reset search input when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('')
    }
  }, [isOpen])

  const filteredCustomers = customers.filter((c) =>
    (c.businessName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Scheduled for ${dayLabel} (${customers.length})`}
      className="max-w-md"
    >
      <div className="flex flex-col gap-4">
        {/* Search Input */}
        <Input
          placeholder="Search business name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />

        {/* Scrollable Customer List */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-sm text-ink-muted">
            {customers.length === 0 ? 'No content scheduled' : 'No matches found'}
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto space-y-1.5 pr-1">
            {filteredCustomers.map((customer) => (
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
                  'flex items-center justify-between p-2 rounded-control transition-colors select-none group focus:outline-none focus:ring-1 focus:ring-primary/20',
                  onCustomerClick && 'cursor-pointer hover:bg-canvas'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={customer.businessName} src={customer.avatarUrl} size={32} />
                  <span className="text-sm font-medium text-ink truncate group-hover:text-primary transition-colors">
                    {customer.businessName}
                  </span>
                </div>
                <Badge tone="neutral" className="shrink-0 text-xs">
                  {customer.postCount} {customer.postCount === 1 ? 'post' : 'posts'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
