/**
 * AdminNavbar.jsx
 * Top bar inside AdminLayout: search, mobile hamburger, action icons,
 * notifications bell with unread badge, and admin profile dropdown.
 *
 * Notification feed is fetched from the same shared backend as the
 * customer dashboard (`/api/notifications`), since the `notifications`
 * table is keyed by `userId` and admin users live in the same table.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, ChevronDown, LogOut, Menu, HelpCircle, Settings2, Loader2, CheckCheck } from "lucide-react";
import { useAdminAuth } from "../../context/useAdminAuth";
import {
  getCustomerNotifications,
  getUnreadCount,
  markAsRead,
} from "../../features/customer/notifications-api";

function relativeTime(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  const delta = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (delta < 60) return "just now";
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function stripHtml(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

function cleanTitle(title) {
  if (!title) return "";
  const cleaned = title
    .replace(/\[\s*admin\s*copy\s*\]/gi, "")
    .replace(/\s*-\s*admin\s*copy/gi, "")
    .replace(/admin\s*copy/gi, "")
    .trim();
  return cleaned || "Approval";
}

export default function AdminNavbar({ onMenuClick }) {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [feed, setFeed] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef(null);

  const initials = admin?.name
    ? admin.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "A";

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    async function fetchCount() {
      try {
        const count = await getUnreadCount();
        if (mounted) setUnreadCount(typeof count === "number" ? count : 0);
      } catch {
        if (mounted) setUnreadCount(0);
      }
    }

    fetchCount();
    intervalId = setInterval(fetchCount, 60000);

    const handler = () => fetchCount();
    window.addEventListener("admin-notifications:unread-changed", handler);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("admin-notifications:unread-changed", handler);
    };
  }, []);

  const openNotifPanel = async () => {
    const willOpen = !notifOpen;
    setNotifOpen(willOpen);
    if (!willOpen) return;
    setLoadingNotifs(true);
    try {
      const list = await getCustomerNotifications({ limit: 10 });
      setFeed(list);
    } catch {
      setFeed([]);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const handleNotifClick = async (n) => {
    if (!n.isRead) {
      setFeed((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markAsRead(n.id);
      } catch {
        setFeed((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: false } : x)));
        setUnreadCount((c) => c + 1);
      }
    }
    setNotifOpen(false);
    navigate("/admin/notifications");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-variant bg-surface px-6 py-3 sticky top-0 z-30">
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

      <div className="flex items-center gap-2 relative">
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifPanel}
            className="relative w-10 h-10 rounded-[9999px] flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-[9999px] bg-error text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-card border border-surface-variant bg-surface shadow-hover z-50 overflow-hidden">
              <div className="border-b border-surface-variant px-4 py-2 text-sm font-semibold text-on-surface flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="px-4 py-6 flex items-center justify-center gap-2 text-sm text-on-surface-variant">
                    <Loader2 size={14} className="animate-spin" />
                    Loading...
                  </div>
                ) : feed.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-on-surface-variant text-center">
                    No notifications yet
                  </div>
                ) : (
                  feed.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-surface-variant/40 hover:bg-surface-container-low transition-colors ${
                        !n.isRead ? "bg-primary-container/10" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-on-surface truncate flex-1">
                          {cleanTitle(n.title)}
                        </p>
                        <span className="text-[10px] text-on-surface-variant shrink-0">
                          {relativeTime(n.sentAt || n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                        {stripHtml(n.message)}
                      </p>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => {
                  setNotifOpen(false);
                  navigate("/admin/notifications");
                }}
                className="w-full px-4 py-2 text-xs font-semibold text-primary hover:bg-surface-container-low border-t border-surface-variant transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        <button
          className="w-10 h-10 rounded-[9999px] flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Help Center"
        >
          <HelpCircle size={18} />
        </button>

        <button
          className="w-10 h-10 rounded-[9999px] flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Quick Settings"
        >
          <Settings2 size={18} />
        </button>

        <div className="h-8 w-px bg-surface-variant mx-2"></div>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-container-high transition-colors"
          >
            {admin?.profileImage ? (
              <img
                src={admin.profileImage.startsWith('http') ? admin.profileImage : `${(import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/api$/, '')}/uploads/${admin.profileImage}`}
                alt={admin.name || 'Admin'}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-surface-variant"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-[9999px] bg-primary text-xs font-bold text-on-primary border border-surface-variant">
                {initials}
              </span>
            )}
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
