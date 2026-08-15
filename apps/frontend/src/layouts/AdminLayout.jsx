/**
 * AdminLayout.jsx
 * Mirrors DashboardLayout (sidebar + navbar) from the customer app, just
 * with an admin-specific nav list. Reuses the same Sidebar/Navbar shared
 * components — do NOT fork a second Sidebar component for admin.
 */
import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/layout/AdminSidebar";
import AdminNavbar from "../components/layout/AdminNavbar";
import GlobalToast from "../components/ui/GlobalToast";

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-container-low text-on-background font-sans">
      {/* Desktop Sidebar (Left Panel, Independent scroll) */}
      <AdminSidebar className="hidden md:flex h-screen shrink-0 bg-surface-container-highest border-r border-surface-variant" />

      {/* Mobile Sidebar Slide-out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-on-background/45 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer container */}
          <AdminSidebar
            className="relative flex w-64 flex-col bg-surface-container-highest h-full shadow-2xl transition-transform duration-300 ease-out z-10"
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area (Right Panel, Independent scroll) */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <AdminNavbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-container-low">
          <div className="max-w-[1400px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
      <GlobalToast />
    </div>
  );
}
