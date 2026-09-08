/**
 * DesignerSidebar.jsx — Premium redesign, isolated to designer portal.
 * Left rail: subtle active (3px orange + tint) not full pill, count chips, availability footer.
 */
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  FolderKanban,
  FileCode2,
  Wallet,
  Settings2,
  Bell,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useDesignerAuth } from "../../context/useDesignerAuth";
import LogoImage from "../../assets/logo.png";
import { cn } from "../../utils/cn";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/designer", icon: LayoutDashboard }],
  },
  {
    label: "Work",
    items: [
      { label: "Tasks", to: "/designer/tasks", icon: ClipboardList },
      { label: "Submissions", to: "/designer/submissions", icon: FolderKanban },
      { label: "Image-to-Code", to: "/designer/image-to-code", icon: FileCode2 },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Payments", to: "/designer/payments", icon: Wallet },
      { label: "Notifications", to: "/designer/notifications", icon: Bell },
      { label: "Settings", to: "/designer/settings", icon: Settings2 },
    ],
  },
];

export default function DesignerSidebar({ className, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const { designer, logout } = useDesignerAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/designer/login", { replace: true });
    if (onClose) onClose();
  };

  return (
    <aside
      className={cn(
        "bg-white border-r border-border flex flex-col py-5 z-40 transition-all duration-200 overflow-y-auto no-scrollbar h-screen",
        collapsed ? "w-[72px]" : "w-64",
        className
      )}
    >
      {/* Header */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-4 mb-6 shrink-0 px-2">
          <img alt="RaaSocial" src={LogoImage} className="h-8 w-8 object-contain rounded-lg" />
          <button
            onClick={() => setCollapsed(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:bg-canvas hover:text-ink transition-colors border border-transparent hover:border-border"
            aria-label="Expand sidebar"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      ) : (
        <div className="px-5 mb-6 flex flex-col gap-1 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img alt="RaaSocial" className="h-8 w-auto object-contain" src={LogoImage} />
              <span className="text-[15px] font-bold tracking-tight text-ink">
                Designer<span className="text-primary">.</span>
              </span>
            </div>
            {!onClose ? (
              <button
                onClick={() => setCollapsed(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft size={16} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:bg-canvas md:hidden"
                aria-label="Close sidebar"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <p className="dp-mono text-ink-muted mt-1">Graphic Workspace</p>
          {designer?.name && (
            <div className="mt-3 flex items-center gap-2.5 p-2.5 rounded-xl bg-canvas border border-border">
              <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                {designer.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink truncate leading-none">{designer.name}</p>
                <p className="text-[11px] text-ink-muted truncate flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success dp-pulse" /> Available for work</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-5 overflow-y-auto no-scrollbar px-2.5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-2.5 mb-2 dp-mono text-ink-muted">{section.label}</p>
            )}
            {collapsed && section.label !== "Overview" && <div className="h-px bg-border mx-2 mb-3" />}
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/designer"}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center rounded-xl transition-all text-[13.5px] font-medium",
                      collapsed ? "justify-center px-2 py-2.5" : "px-2.5 py-2",
                      isActive
                        ? "bg-primary-50 text-ink border border-primary-100 shadow-sm"
                        : "text-ink-muted hover:bg-canvas hover:text-ink border border-transparent"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-full" />
                      )}
                      <span
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isActive ? "bg-white border border-primary-100 text-primary shadow-sm" : "bg-transparent text-ink-muted group-hover:text-ink-muted"
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      {!collapsed && <span className="ml-2.5 flex-1 truncate">{label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2.5 mt-auto pt-4 flex flex-col gap-3 shrink-0">
        {!collapsed && (
          <div className="rounded-xl bg-ink p-3 flex items-center gap-2.5 text-white">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Sparkles size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold leading-none">₦248k earned</p>
              <p className="text-[11px] text-white/60">31 approved • 66% rate</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "Log Out" : undefined}
          className={cn(
            "flex items-center rounded-xl transition-colors text-[13px] font-medium border",
            collapsed
              ? "justify-center w-10 h-10 mx-auto text-ink-muted hover:bg-canvas border-transparent hover:border-border hover:text-ink"
              : "px-2.5 py-2 text-ink-muted hover:bg-canvas hover:text-ink border-transparent hover:border-border w-full text-left gap-2.5"
          )}
        >
          <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white border border-border text-ink-muted">
            <LogOut size={14} />
          </span>
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
