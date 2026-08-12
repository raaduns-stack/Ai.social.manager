import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Search, ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import Avatar from '../ui/Avatar'

/**
 * Top navbar shown inside the dashboard shell.
 * Fetches user info from AuthContext and supports logout dropdown.
 */
export default function Navbar({ user = { name: 'Jane Doe' }, notificationCount = 0 }) {
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  const currentUser = authUser || user
  const displayName = currentUser?.fullName || currentUser?.name || 'User'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-2 rounded-control border border-border px-3 py-1.5 text-sm text-ink-muted w-72">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-transparent outline-none placeholder:text-ink-muted"
        />
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/notifications"
          aria-label="Notifications"
          className="relative rounded-control p-2 text-ink-muted hover:bg-canvas hover:text-ink"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
              {notificationCount}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-control px-2 py-1.5 hover:bg-canvas transition-colors"
          >
            <Avatar name={displayName} />
            <span className="hidden sm:block text-sm text-ink font-medium">
              {displayName}
            </span>
            <ChevronDown size={14} className="text-ink-muted" />
          </button>

          {profileOpen && (
            <>
              {/* Overlay to close dropdown on click outside */}
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-card border border-border bg-surface shadow-hover z-50">
                <div className="px-4 py-3 text-sm border-b border-border">
                  <p className="font-semibold text-ink truncate">{displayName}</p>
                  {currentUser?.email && (
                    <p className="text-xs text-ink-muted truncate mt-0.5">{currentUser.email}</p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-canvas rounded-b-card transition-colors z-50"
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
