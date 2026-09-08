import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

/**
 * Usage:
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Post details">
 *   ...content
 * </Modal>
 * Rendered via portal to document.body to avoid clipping by parent overflow-hidden (DesignerLayout).
 */
export default function Modal({ open, onClose, title, children, className }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  if (typeof document === 'undefined') return null

  const node = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop — ink/40 with fallback */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'designer-premium relative w-full max-w-lg rounded-card bg-white p-6 shadow-hover max-h-[90vh] overflow-hidden flex flex-col',
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between shrink-0">
          {title ? <h2 className="text-lg font-semibold text-ink">{title}</h2> : <span />}
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-control p-1.5 text-ink-muted hover:bg-canvas hover:text-ink border border-transparent hover:border-border transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto dp-scroll min-h-0">{children}</div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
