/**
 * AdminNavbar.jsx
 * Top bar inside AdminLayout: search (optional, UI-only), notifications
 * bell with unread badge, admin profile dropdown with logout.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, ChevronDown, LogOut } from "lucide-react";
import { useAdminAuth } from "../../context/useAdminAuth";
import { notifications } from "../../data/mockData";

export default function AdminNavbar() {
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
    <header className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-6 py-3">
      {/* Search — optional, UI-only, no real query wiring */}
      <div className="hidden sm:flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-1.5 w-72">
        <Search size={16} className="text-[#6B7280]" />
        <input
          placeholder="Search customers, tickets, logs..."
          className="w-full text-sm outline-none placeholder:text-[#6B7280]"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-lg p-2 text-[#6B7280] hover:bg-[#F9FAFB]"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-card border border-[#E5E7EB] bg-white shadow-lg z-10">
              <div className="border-b border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#111827]">
                Notifications
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 text-sm border-b border-[#E5E7EB] last:border-0">
                    <p className="text-[#111827]">{n.message}</p>
                    <p className="mt-0.5 text-xs text-[#6B7280]">{n.sentAt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F9FAFB]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6600] text-xs font-medium text-white">
              {initials}
            </span>
            <span className="hidden sm:block text-sm text-[#111827]">
              {admin?.name ?? "Admin"}
            </span>
            <ChevronDown size={14} className="text-[#6B7280]" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-card border border-[#E5E7EB] bg-white shadow-lg z-10">
              <div className="px-4 py-3 text-sm border-b border-[#E5E7EB]">
                <p className="font-medium text-[#111827]">{admin?.name}</p>
                <p className="text-xs text-[#6B7280]">{admin?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#EF4444] hover:bg-[#F9FAFB]"
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
