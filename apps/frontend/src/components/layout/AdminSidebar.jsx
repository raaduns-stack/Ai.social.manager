/**
 * AdminSidebar.jsx
 * Navigation for every admin module. Active route is highlighted via
 * NavLink's isActive. Collapsible — click the chevron at the bottom to
 * shrink to icon-only width.
 */
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Sparkles,
  Bell,
  ScrollText,
  CreditCard,
  Share2,
  UploadCloud,
  BarChart3,
  Settings2,
  Headset,
  Cog,
  Wallet,
  UserCheck,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  HelpCircle,
  ShieldCheck,
  X,
  LogOut,
  Bolt,
} from "lucide-react";
import { useState } from "react";
import { useAdminAuth } from "../../context/useAdminAuth";
import { cn } from "../../utils/cn";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Customers",
    items: [
      { label: "User Management", to: "/admin/users", icon: Users },
      { label: "KYC Verification", to: "/admin/kyc", icon: ShieldCheck },
      { label: "Content Calendar", to: "/admin/calendar", icon: Calendar },
      { label: "AI Content", to: "/admin/ai-content", icon: Sparkles },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Billing", to: "/admin/billing", icon: CreditCard },
      { label: "Social Accounts", to: "/admin/social-accounts", icon: Share2 },
      { label: "Money Management", to: "/admin/money-management", icon: Wallet },
      { label: "Uploads", to: "/admin/uploads", icon: UploadCloud },
      { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "AI Configuration", to: "/admin/ai-config", icon: Cog },
      { label: "Support Center", to: "/admin/support", icon: Headset },
      { label: "FAQ Manager", to: "/admin/faqs", icon: HelpCircle },
      { label: "Staff Dashboard", to: "/admin/staff", icon: LayoutDashboard },
      { label: "Manage Staff", to: "/admin/staff/manage", icon: UserCheck },
      { label: "Roles & Permissions", to: "/admin/staff/roles-permissions", icon: Settings2 },
      { label: "Login History", to: "/admin/staff/login-history", icon: Clock },
      { label: "Activity Logs", to: "/admin/staff/activity-logs", icon: ScrollText },
      { label: "Notifications", to: "/admin/notifications", icon: Bell },
      { label: "Audit Logs", to: "/admin/logs", icon: ScrollText },
      { label: "Settings", to: "/admin/settings", icon: Settings2 },
    ],
  },
];

const ROUTE_MODULE_MAP = {
  "/admin/dashboard": "dashboard",
  "/admin/users": "user_management",
  "/admin/kyc": "user_management",
  "/admin/calendar": "content_calendar",
  "/admin/ai-content": "content_creation",
  "/admin/billing": "billing",
  "/admin/social-accounts": "social_accounts",
  "/admin/money-management": "money_management",
  "/admin/uploads": "upload_management",
  "/admin/analytics": "analytics",
  "/admin/ai-config": "ai_config",
  "/admin/support": "support",
  "/admin/faqs": "support",
  "/admin/staff": "staff_management",
  "/admin/staff/manage": "staff_management",
  "/admin/staff/roles-permissions": "staff_management",
  "/admin/staff/login-history": "audit_logs",
  "/admin/staff/activity-logs": "audit_logs",
  "/admin/notifications": "notification_management",
  "/admin/logs": "audit_logs",
};

export default function AdminSidebar({ className, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const { admin, permissions, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
    if (onClose) onClose();
  };

  const filteredSections = NAV_SECTIONS.map((section) => {
    const visibleItems = section.items.filter((item) => {
      if (item.to === "/admin/settings") return true;
      const mod = ROUTE_MODULE_MAP[item.to];
      if (mod && permissions && permissions[mod] === "none") {
        return false;
      }
      return true;
    });
    return { ...section, items: visibleItems };
  }).filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        "bg-surface-container-highest dark:bg-inverse-surface border-r border-surface-variant flex flex-col py-6 z-40 transition-all overflow-y-auto no-scrollbar h-screen",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      {collapsed ? (
        <div className="flex flex-col items-center justify-center mb-8 gap-4 shrink-0">
          <div className="w-8 h-8 rounded bg-primary-container text-on-primary flex items-center justify-center font-bold">R</div>
          <button
            onClick={() => setCollapsed(false)}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      ) : (
        <div className="px-6 mb-8 flex flex-col gap-1 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary-container text-on-primary flex items-center justify-center font-bold">R</div>
              <h1 className="font-headline-xl text-headline-xl text-primary-container" style={{ fontSize: "24px", lineHeight: "32px" }}>Raasocial</h1>
            </div>
            
            {!onClose ? (
              <button
                onClick={() => setCollapsed(true)}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft size={18} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-variant/50 transition-colors md:hidden"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <p className="font-ui-mono text-ui-mono text-on-surface-variant mt-1">AI Management</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar px-2">
        {filteredSections.map((section) => (
          <div key={section.label} className="mb-4">
            {!collapsed && (
              <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-4 py-2 rounded-lg transition-all cursor-pointer active:opacity-80 group font-label-bold text-label-bold",
                      isActive
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface",
                      collapsed ? "justify-center" : ""
                    )
                  }
                >
                  <Icon size={18} className={cn("shrink-0", collapsed ? "" : "mr-3")} />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 mt-auto pt-4 flex flex-col gap-3 shrink-0">
        {collapsed ? (
          <button
            className="mx-auto bg-primary-container text-on-primary p-2 rounded flex items-center justify-center hover:brightness-95 transition-all"
            title="Upgrade Plan"
          >
            <Bolt size={18} />
          </button>
        ) : (
          <button className="w-full bg-primary-container text-on-primary font-label-bold text-label-bold py-2 px-4 rounded-DEFAULT flex items-center justify-center gap-2 hover:brightness-95 transition-all">
            <Bolt size={18} />
            Upgrade Plan
          </button>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? "Log Out" : undefined}
          className="text-on-surface-variant flex items-center px-4 py-2 hover:bg-surface-variant rounded-lg transition-all cursor-pointer active:opacity-80 group font-label-bold text-label-bold w-full text-left"
        >
          <LogOut size={18} className={cn("shrink-0", collapsed ? "mx-auto" : "mr-3")} />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
