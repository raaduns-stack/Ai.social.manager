import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Share2,
  Calendar,
  UploadCloud,
  TrendingUp,
  CreditCard,
  HelpCircle,
  Settings,
} from 'lucide-react'
import { cn } from '../../utils/cn'

// Main sidebar links
const mainLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/calendar', label: 'Content Calendar', icon: Calendar },
  { to: '/dashboard/channels', label: 'Channels', icon: Share2 },
  { to: '/dashboard/uploads', label: 'Uploads', icon: UploadCloud },
  { to: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
]

// Bottom sidebar links
const bottomLinks = [
  { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { to: '/dashboard/support', label: 'Support', icon: HelpCircle },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ className, onClose }) {
  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r border-gray-200 bg-white py-4 overflow-y-auto',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 pb-6 shrink-0 border-b border-gray-100 mb-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
          <img
            alt="Raasocial Workspace Logo"
            className="object-cover w-full h-full"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGeopwcq4eYp_ZT8LdWNPGdxbOjwmHBNUk9q8MwUfiTH2SNx_7gEnMhJysNs62qMdmAwr079e7I4oH5vTItQgGYH8B9WEw9NS6Mm6KNfxxVNGUB3QEqhlV4fI7pii7c_y1pYVrx-Xm-9YoGLk9tLfbVlJRuRuruP2_U1xTFjQzT5Tluti_zaFMoWemnQJIOXG1CRU5J0NTEkFhh8ve69osdmNbd7cd4DpASoiuT485CjdUyKSB54Zivw"
          />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-[#111111] leading-tight font-['Plus_Jakarta_Sans']">Raasocial</h1>
          <p className="text-[10px] text-[#999999] tracking-wider uppercase font-mono mt-0.5">Kleos AI Powered</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1.5 px-4">
        {mainLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-gray-50 text-[#FF6600] border-r-2 border-[#FF6600] opacity-100 font-bold'
                  : 'text-[#666666] hover:bg-gray-50 hover:text-[#111111]'
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="mt-auto pt-6 border-t border-gray-100 space-y-1 px-4 mb-4">
        {bottomLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-gray-50 text-[#FF6600] border-r-2 border-[#FF6600] opacity-100 font-bold'
                  : 'text-[#666666] hover:bg-gray-50 hover:text-[#111111]'
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
