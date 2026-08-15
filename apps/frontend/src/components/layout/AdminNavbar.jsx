/**
 * AdminNavbar.jsx
 * Top bar inside AdminLayout: search, mobile hamburger, action icons,
 * notifications bell with unread badge, and admin profile dropdown.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, ChevronDown, LogOut, Menu, HelpCircle, Settings2 } from "lucide-react";
import { useAdminAuth } from "../../context/useAdminAuth";
import { notifications } from "../../data/mockData";

export default function AdminNavbar({ onMenuClick }) {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.length;

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const initials = admin?.name
    ? admin.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "A";

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-variant bg-surface px-6 py-3 sticky top-0 z-30">
      {/* Left Search & Mobile Toggle */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <button
          onClick={onMenuClick}
          className="mr-2 rounded-lg p-2 text-on-surface-variant hover:bg-surface-variant/50 md:hidden shrink-0 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-surface-variant bg-surface-container-low px-3 py-1.5 w-full">
          <Search size={16} className="text-on-surface-variant/70" />
          <input
            placeholder="Search commands, users..."
            className="w-full text-sm bg-transparent outline-none placeholder:text-on-surface-variant/50 text-on-surface"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 relative">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-10 h-10 rounded-[9999px] flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-[9999px] bg-error text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-card border border-surface-variant bg-surface shadow-hover z-50">
              <div className="border-b border-surface-variant px-4 py-2 text-sm font-semibold text-on-surface">
                Notifications
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 text-sm border-b border-surface-variant last:border-0 hover:bg-surface-container-low transition-colors">
                    <p className="text-on-surface font-medium">{n.message}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant/70">{n.sentAt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help Button */}
        <button
          className="w-10 h-10 rounded-[9999px] flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Help Center"
        >
          <HelpCircle size={18} />
        </button>

        {/* Settings Button */}
        <button
          className="w-10 h-10 rounded-[9999px] flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Quick Settings"
        >
          <Settings2 size={18} />
        </button>

        <div className="h-8 w-px bg-surface-variant mx-2"></div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-container-high transition-colors"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[9999px] bg-primary text-xs font-bold text-on-primary border border-surface-variant">
              {initials}
            </span>
            <span className="hidden sm:block text-sm font-semibold text-on-surface">
              {admin?.name ?? "Admin"}
            </span>
            <ChevronDown size={14} className="text-on-surface-variant" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-card border border-surface-variant bg-surface shadow-hover z-50 p-1.5 space-y-1">
              <div className="px-3 py-2 text-sm border-b border-surface-variant/40 mb-1">
                <p className="font-semibold text-on-surface">{admin?.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{admin?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-red-500/10 rounded-control transition-colors text-left"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
