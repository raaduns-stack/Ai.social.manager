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
} from "lucide-react";
import { useState } from "react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Customers",
    items: [
      { label: "User Management", to: "/admin/users", icon: Users },
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
      { label: "Staff Directory", to: "/admin/staff", icon: UserCheck },
      { label: "Notifications", to: "/admin/notifications", icon: Bell },
      { label: "Audit Logs", to: "/admin/logs", icon: ScrollText },
      { label: "Settings", to: "/admin/settings", icon: Settings2 },
    ],
  },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

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

      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="mb-6">
          {!collapsed && (
            <p className="px-2 mb-2 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              {section.label}
            </p>
          )}
          <nav className="flex flex-col gap-1">
            {section.items.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${isActive
                    ? "bg-[#4F46E5]/10 text-[#4F46E5] font-medium"
                    : "text-[#111827] hover:bg-[#F9FAFB]"
                  } ${collapsed ? "justify-center" : ""}`
                }
              >
                <Icon size={16} />
                {!collapsed && label}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  );
}
