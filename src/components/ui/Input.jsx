import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

/**
 * Usage: <Input label="Email" type="email" placeholder="you@company.com" error={errors.email} />
 */
const Input = forwardRef(({ label, error, className, id, ...props }, ref) => {
  const inputId = id || props.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          error && 'border-danger focus:ring-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
