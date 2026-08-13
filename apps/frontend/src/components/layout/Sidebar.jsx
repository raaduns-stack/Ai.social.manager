import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Share2,
  Calendar,
  UploadCloud,
  Sparkles,
  TrendingUp,
  CreditCard,
  HelpCircle,
  Settings,
} from 'lucide-react'
import { cn } from '../../utils/cn'

// Main sidebar links
const mainLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/channels', label: 'Channels', icon: Share2 },
  { to: '/dashboard/calendar', label: 'Content Calendar', icon: Calendar },
  { to: '/dashboard/uploads', label: 'Uploads', icon: UploadCloud },
  { to: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
]

// Bottom sidebar links
const bottomLinks = [
  { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { to: '/dashboard/support', label: 'Support', icon: HelpCircle },
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
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 shrink-0">
        <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-soft shrink-0">
          <Sparkles className="fill-current w-4.5 h-4.5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-primary leading-tight">Raasocial</h1>
          <p className="text-[10px] text-ink-muted mt-0.5 leading-none">Pro Workspace</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        {mainLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-ink-muted hover:bg-canvas hover:text-ink'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-border mx-3 my-2" />

      {/* Bottom Navigation */}
      <nav className="space-y-1 px-3 pb-4 shrink-0">
        {bottomLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold'
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
