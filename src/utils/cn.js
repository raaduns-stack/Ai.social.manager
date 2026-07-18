import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely, letting later classes win over conflicting earlier ones.
 * Usage: cn('px-4 py-2', condition && 'bg-primary', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
