import { NavLink, Link } from 'react-router-dom'
import LogoImage from '../../assets/logo.jpg'
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
      <div className="flex items-center px-6 pb-6 shrink-0 border-b border-gray-100 mb-6">
        <Link to="/dashboard" className="flex items-center">
          <img
            alt="RaaSocial Logo"
            className="h-10 object-contain w-auto max-w-[180px]"
            src={LogoImage}
          />
        </Link>
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
