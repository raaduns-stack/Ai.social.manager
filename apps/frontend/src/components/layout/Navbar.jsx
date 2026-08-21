import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Search, ChevronDown, LogOut, Menu, Bolt, User } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import Avatar from '../ui/Avatar'

/**
 * Top navbar shown inside the dashboard shell.
 * Fetches user info from AuthContext and supports logout dropdown.
 */
export default function Navbar({ user = { name: 'Jane Doe' }, notificationCount = 0, onMenuClick }) {
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  const currentUser = authUser || user
  const displayName = currentUser?.fullName || currentUser?.name || 'User'
  const fallbackAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgbu9QpWm4wQglUF3LIrDjmn1K83rcrFdD5RAiNPgHcHWuinsZHaPvps1q-NaZ8HzC0lpkNvPXGFRrCSQ0XWyhe0u_wLRdJEWSTDNxCnxG0sMQH-OphJlI2TzTqfgCOaowg7JdkqvKgEjGTFgz2r_9VCScr6dNGVGoGRVaCO_UAth5YCEPvJKswnv4pA5Fmz0iipAIL5vsE48m2rafEIwwIyK7cU2aay4Afy1lOd0dqDcsKenwrk0XNQ'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Trigger (Visible only on mobile) */}
        <button 
          onClick={onMenuClick}
          className="md:hidden text-[#111111] hover:text-[#FF6600] transition-colors p-1"
          aria-label="Toggle Menu"
        >
          <Menu size={22} />
        </button>

        {/* Search Field (Hidden on very small mobile if desired, styled rounded-full) */}
        <div className="relative hidden sm:flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-full px-3.5 py-1.5 text-sm text-[#666666] w-64 focus-within:border-[#111111] transition-colors">
          <Search size={16} className="text-[#999999]" />
          <input
            type="text"
            placeholder="Search insights, posts..."
            className="w-full bg-transparent outline-none placeholder:text-[#999999] text-[#111111]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Link
          to="/dashboard/notifications"
          aria-label="Notifications"
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#666666] hover:text-[#FF6600] hover:bg-gray-50 transition-colors"
        >
          <Bell size={20} />
          {(notificationCount > 0 || true) && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF6600] rounded-full"></span>
          )}
        </Link>

        {/* Quick Bolt Action */}
        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#666666] hover:text-[#FF6600] hover:bg-gray-50 transition-colors"
          aria-label="Quick Actions"
        >
          <Bolt size={20} />
        </button>

        {/* Profile Dropdown */}
        <div className="relative ml-2">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-gray-50 transition-colors"
          >
            {currentUser?.profileImage ? (
              <img 
                src={currentUser.profileImage.startsWith('http') ? currentUser.profileImage : `${(import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/api$/, '')}/uploads/${currentUser.profileImage}`} 
                alt={displayName} 
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : currentUser?.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={displayName} 
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
                {(displayName || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="hidden sm:block text-sm text-[#111111] font-semibold">
              {displayName}
            </span>
            <ChevronDown size={14} className="text-[#999999]" />
          </button>

          {profileOpen && (
            <>
              {/* Overlay to close dropdown on click outside */}
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                <div className="px-4 py-3 text-sm border-b border-gray-100">
                  <p className="font-bold text-[#111111] truncate">{displayName}</p>
                  {currentUser?.email && (
                    <p className="text-xs text-[#666666] truncate mt-0.5">{currentUser.email}</p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-gray-50 rounded-b-lg transition-colors z-50"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
