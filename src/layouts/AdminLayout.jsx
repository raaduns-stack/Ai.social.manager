/**
 * AdminLayout.jsx
 * Mirrors DashboardLayout (sidebar + navbar) from the customer app, just
 * with an admin-specific nav list. Reuses the same Sidebar/Navbar shared
 * components — do NOT fork a second Sidebar component for admin.
 */
import { Outlet } from "react-router-dom";
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
} from "lucide-react";

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
      { label: "Uploads", to: "/admin/uploads", icon: UploadCloud },
      { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "AI Configuration", to: "/admin/ai-config", icon: Cog },
      { label: "Support Center", to: "/admin/support", icon: Headset },
      { label: "Notifications", to: "/admin/notifications", icon: Bell },
      { label: "Audit Logs", to: "/admin/logs", icon: ScrollText },
      { label: "Settings", to: "/admin/settings", icon: Settings2 },
    ],
  },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-[#F9FAFB]">
      <aside className="w-64 shrink-0 border-r border-[#E5E7EB] bg-white px-4 py-6">
        <div className="mb-8 px-2 text-lg font-semibold text-[#111827]">
          Admin Panel
        </div>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="px-2 mb-2 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              {section.label}
            </p>
            <nav className="flex flex-col gap-1">
              {section.items.map(({ label, to, icon: Icon }) => (
                <a
                  key={to}
                  href={to}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#111827] hover:bg-[#F9FAFB]"
                >
                  <Icon size={16} />
                  {label}
                </a>
              ))}
            </nav>
          </div>
        ))}
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Reuse the existing Navbar component here instead of a new one */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
