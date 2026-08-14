/**
 * AdminLayout.jsx
 * Mirrors DashboardLayout (sidebar + navbar) from the customer app, just
 * with an admin-specific nav list. Reuses the same Sidebar/Navbar shared
 * components — do NOT fork a second Sidebar component for admin.
 */
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/layout/AdminSidebar";
import AdminNavbar from "../components/layout/AdminNavbar";
import GlobalToast from "../components/ui/GlobalToast";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-[#F9FAFB]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <GlobalToast />
    </div>
  );
}
