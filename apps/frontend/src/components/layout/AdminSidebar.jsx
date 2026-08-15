/**
 * AdminSidebar.jsx
 * Navigation for every admin module. Active route is highlighted via
 * NavLink's isActive. Collapsible — click the chevron at the bottom to
 * shrink to icon-only width (state stays local, resets on refresh, which
 * is fine for a demo).
 */
import { NavLink } from "react-router-dom";
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
  Wallet, // 👈 ADDED
  UserCheck,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useAdminAuth } from "../../context/useAdminAuth";

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

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { admin, permissions } = useAdminAuth();

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
      className={`shrink-0 border-r border-[#E5E7EB] bg-white py-6 transition-all ${collapsed ? "w-16 px-2" : "w-64 px-4"
        }`}
    >
      <div
        className={`mb-8 flex items-center px-2 text-lg font-semibold text-[#111827] ${collapsed ? "justify-center" : "justify-between"
          }`}
      >
        {!collapsed && <span>Admin Panel</span>}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-lg p-1 text-[#6B7280] hover:bg-[#F9FAFB]"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      {filteredSections.map((section) => (
        <div key={section.label} className="mb-6">
          {!collapsed && (
            <p className="px-2 mb-2 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              {section.label}
            </p>
          )}
          <nav className="flex flex-col gap-1">
            {section.items.map(({ label, to, icon: Icon }) => {
              return (
                <NavLink
                  key={to}
                  to={to}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${isActive
                      ? "bg-[#FF6600]/10 text-[#FF6600] font-medium"
                      : "text-[#111827] hover:bg-[#F9FAFB]"
                    } ${collapsed ? "justify-center" : ""}`
                  }
                >
                  <Icon size={16} />
                  {!collapsed && label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}
