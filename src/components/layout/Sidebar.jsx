import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Share2,
  CalendarDays,
  UploadCloud,
  Sparkles,
  BarChart3,
  CreditCard,
  LifeBuoy,
  Bell,
  Settings,
} from 'lucide-react'
import { cn } from '../../utils/cn'

// Single source of truth for sidebar links.
// Add/remove a page here and the sidebar updates everywhere.
const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/channels', label: 'Channels', icon: Share2 },
  { to: '/dashboard/calendar', label: 'Content Calendar', icon: CalendarDays },
  { to: '/dashboard/uploads', label: 'Uploads', icon: UploadCloud },
  { to: '/dashboard/suggestions', label: 'AI Suggestions', icon: Sparkles },
  { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { to: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ className }) {
  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r border-border bg-surface',
        className
      )}
    >
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-bold text-ink">AI Social Manager</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-ink-muted hover:bg-canvas hover:text-ink'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
