import { format, formatDistanceToNow } from 'date-fns'

export function naira(kobo: number): string {
  const nairaValue = kobo / 100
  return '₦' + nairaValue.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

export function nairaShort(kobo: number): string {
  const nairaValue = kobo / 100
  if (Math.abs(nairaValue) >= 1000) {
    return '₦' + Math.round(nairaValue / 1000) + 'k'
  }
  return '₦' + nairaValue.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

export function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return '—'
  }
}

export function formatDue(iso: string | null): string {
  if (!iso) return 'No due date'
  try {
    return format(new Date(iso), 'MMM dd')
  } catch {
    return '—'
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || ''

export function resolveFileUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  try {
    const base = new URL(API_BASE_URL, window.location.origin)
    return base.origin + (path.startsWith('/') ? path : '/' + path)
  } catch {
    return path
  }
}

export function groupLabel(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000,
  )
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return 'Earlier'
}
