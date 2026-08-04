import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Usage:
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Post details">
 *   ...content
 * </Modal>
 */
export default function Modal({ open, onClose, title, children, className }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full max-w-lg rounded-card bg-surface p-6 shadow-hover',
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-control p-1 text-ink-muted hover:bg-canvas hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
