import { cn } from '../../utils/cn'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-700',
  secondary: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
  outline: 'border border-border text-ink hover:bg-canvas',
  ghost: 'text-ink-muted hover:bg-canvas hover:text-ink',
  destructive: 'bg-danger text-white hover:bg-red-600',
}

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

/**
 * Usage: <Button variant="primary" size="md">Get Started</Button>
 * Variants: primary | secondary | outline | ghost | destructive
 */
export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
