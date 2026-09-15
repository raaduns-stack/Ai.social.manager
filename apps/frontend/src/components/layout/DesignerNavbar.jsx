/**
 * DesignerNavbar.jsx — Premium glass header, scoped to designer portal.
 * Live data only: notification preview + payout/approval figures come from the API.
 * Shell fetches degrade silently — the navbar never blocks the page on error.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bell, Command, ChevronDown, LogOut, Menu, UploadCloud, Sparkles, Settings2, User } from "lucide-react";
import { useDesignerAuth } from "../../context/useDesignerAuth";
import {
  getDesignerNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../features/designer/designer-api";
import { naira, timeAgo, resolveFileUrl } from "../../features/designer/format";

const TONE_DOT = {
  task: "bg-primary",
  revision: "bg-danger",
  approved: "bg-success",
  payment: "bg-success",
  system: "bg-ink-muted",
};

function initialsOf(name) {
  if (!name) return "DG";
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

export default function DesignerNavbar({ onMenuClick, summary }) {
  const { designer, logout } = useDesignerAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [markingAll, setMarkingAll] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const loadNotifs = useCallback(async () => {
    try {
      setNotifs(await getDesignerNotifications());
    } catch {
      // Silent — the dropdown shows an empty state; page-level
      // errors live on /designer/notifications.
    }
  }, []);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const preview = notifs.slice(0, 5);

  const handleLogout = () => {
    logout();
    navigate("/designer/login", { replace: true });
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "All notifications marked read", type: "success" } }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: e?.message || "Could not mark all as read.", type: "error" } }));
    } finally {
      setMarkingAll(false);
      setNotifOpen(false);
    }
  };

  const handleNotifClick = async (id, alreadyRead) => {
    setNotifOpen(false);
    if (!alreadyRead) {
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      try {
        await markNotificationRead(id);
      } catch {
        setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
      }
    }
    navigate("/designer/notifications");
  };

  const initials = initialsOf(designer?.name);
  const avatarUrl = resolveFileUrl(designer?.avatar);
  const pending = summary?.pendingEarnings ?? null;
  const approvalRate = summary?.approvalRate ?? null;

  return (
    <header className="dp-glass sticky top-0 z-30 flex h-14 items-center justify-between px-4 sm:px-6">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-ink-muted hover:bg-canvas border border-transparent hover:border-border transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="hidden lg:flex items-center gap-2 text-xs text-ink-muted">
          <span className="w-2 h-2 rounded-full bg-success dp-pulse" />
          <span className="font-medium">Available for work</span>
          {pending > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{naira(pending)} pending</span>
            </>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* CmdK */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Command palette — press ⌘K (coming soon)", type: "info" } }))}
          className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-xl border border-border bg-white text-xs font-medium text-ink-muted hover:border-primary-100 hover:bg-primary-50 hover:text-ink transition-colors"
        >
          <Command size={12} />
          <span>⌘K</span>
          <span className="hidden lg:inline text-ink-muted">Search tasks…</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((o) => !o); if (!notifOpen) loadNotifs(); }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-border text-ink-muted hover:border-primary-100 hover:bg-primary-50 hover:text-ink transition-colors"
            aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : "Notifications"}
          >
            <Bell size={16} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white" />}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-white shadow-premium z-50 overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                <p className="text-sm font-bold text-ink">
                  Notifications{unreadCount > 0 && <span className="ml-1.5 text-xs font-semibold text-primary">{unreadCount} unread</span>}
                </p>
                <button
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0 || markingAll}
                  className="text-xs font-semibold text-primary hover:text-primary-700 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {markingAll ? "Marking…" : "Mark all read"}
                </button>
              </div>
              <div className="p-2 space-y-1 max-h-80 overflow-y-auto dp-scroll">
                {preview.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-ink-muted">You&apos;re all caught up.</p>
                ) : (
                  preview.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n.id, n.read)}
                      className="w-full text-left flex gap-2.5 p-2.5 rounded-xl hover:bg-canvas border border-transparent hover:border-border transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${TONE_DOT[n.type] || TONE_DOT.system}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-ink leading-snug line-clamp-2">{n.title}</p>
                        <p className="text-[11px] text-ink-muted mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary dp-pulse mt-1.5 shrink-0" />}
                    </button>
                  ))
                )}
                <Link
                  to="/designer/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="block text-center text-xs font-semibold text-primary hover:text-primary-700 py-2 border-t border-border mt-2"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:block h-6 w-px bg-border mx-1" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-xl bg-white border border-border hover:border-primary-100 hover:bg-primary-50 transition-colors"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {initials}
              </span>
            )}
            <span className="hidden sm:block text-[13px] font-semibold text-ink max-w-[130px] truncate">
              {designer?.name ?? "Designer"}
            </span>
            <ChevronDown size={14} className="text-ink-muted hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-white shadow-premium z-50 overflow-hidden">
              <div className="p-3">
                <div className="flex gap-3 p-2.5 rounded-xl bg-canvas border border-border">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink truncate flex items-center gap-1.5">
                      {designer?.name} <Sparkles size={12} className="text-primary" />
                    </p>
                    <p className="text-xs text-ink-muted truncate">{designer?.email}</p>
                    <p className="text-[11px] font-semibold text-primary capitalize mt-1">
                      {designer?.role}{approvalRate != null ? ` • ${approvalRate}% approval` : ""}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-2 pb-2 space-y-0.5">
                <Link to="/designer/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-ink hover:bg-canvas transition-colors">
                  <User size={14} className="text-ink-muted" /> View profile
                </Link>
                <Link to="/designer/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-ink hover:bg-canvas transition-colors">
                  <Settings2 size={14} className="text-ink-muted" /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-danger hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <Link
          to="/designer/submissions"
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <UploadCloud size={14} /> Upload
        </Link>
      </div>
    </header>
  );
}
