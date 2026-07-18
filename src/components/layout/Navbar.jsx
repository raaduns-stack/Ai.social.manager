import { Bell, Search } from 'lucide-react'
import Avatar from '../ui/Avatar'

/**
 * Top navbar shown inside the dashboard shell.
 * Wire up `user` and notification count from your auth/context state later.
 */
export default function Navbar({ user = { name: 'Jane Doe' }, notificationCount = 0 }) {
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
        <button
          aria-label="Notifications"
          className="relative rounded-control p-2 text-ink-muted hover:bg-canvas hover:text-ink"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
              {notificationCount}
            </span>
          )}
        </button>
        <Avatar name={user.name} />
      </div>
    </header>
  )
}
