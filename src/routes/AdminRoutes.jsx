/**
 * AdminRoutes.jsx
 * ---------------------------------------------------------------------------
 * Admin lives under /admin/* in the SAME repo as the customer app.
 * Reuses AppRoutes.jsx's pattern — this is just a nested Route tree,
 * mounted once from the main router:
 *
 *   import AdminRoutes from "./routes/AdminRoutes";
 *   <Route path="/admin/*" element={<AdminRoutes />} />
 *
 * SHARED FILE — same rule as Sidebar/Navbar/Tailwind config: flag in the
 * group chat before editing this, don't edit silently on your branch.
 * ---------------------------------------------------------------------------
 */
import { Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import RequireAdminAuth from "./RequireAdminAuth";
import AdminLayout from "../layouts/AdminLayout";

// --- Pascal's pages ---
import AdminDashboard from "../pages/Admin/Dashboard";
import AdminUsers from "../pages/Admin/Users";
import AdminUserDetail from "../pages/Admin/UserDetail";
import AdminContentCalendar from "../pages/Admin/ContentCalendar";
import AdminAIContent from "../pages/Admin/AIContent";
import AdminNotifications from "../pages/Admin/Notifications";
import AdminAuditLogs from "../pages/Admin/AuditLogs";

// --- Treasure's pages ---
import AdminBilling from "../pages/Admin/Billing";
import AdminSocialAccounts from "../pages/Admin/SocialAccounts";
import AdminUploads from "../pages/Admin/Uploads";
import AdminAnalytics from "../pages/Admin/Analytics";
import AdminAIConfig from "../pages/Admin/AIConfiguration";
import AdminSupport from "../pages/Admin/Support";
import AdminSettings from "../pages/Admin/Settings";

// --- Auth (shared) ---
import AdminLogin from "../pages/Admin/AdminLogin";
import NotFound from "../pages/NotFound";

export default function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Routes>
        {/* Admin auth screens sit OUTSIDE AdminLayout (no sidebar) */}
        <Route path="login" element={<AdminLogin />} />

        {/* Everything else sits inside the admin shell (sidebar + navbar) */}
        <Route
          element={
            <RequireAdminAuth>
              <AdminLayout />
            </RequireAdminAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* User Management (Pascal) */}
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:userId" element={<AdminUserDetail />} />

          {/* Content Calendar + AI Content (Pascal) */}
          <Route path="calendar" element={<AdminContentCalendar />} />
          <Route path="ai-content" element={<AdminAIContent />} />

          {/* Notifications + Audit Logs (Pascal) */}
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="logs" element={<AdminAuditLogs />} />

          {/* Billing + Social Accounts + Uploads (Treasure) */}
          <Route path="billing" element={<AdminBilling />} />
          <Route path="social-accounts" element={<AdminSocialAccounts />} />
          <Route path="uploads" element={<AdminUploads />} />

          {/* Analytics + AI Config (Treasure) */}
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="ai-config" element={<AdminAIConfig />} />

          {/* Support + Settings (Treasure) */}
          <Route path="support" element={<AdminSupport />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Catch-all 404 for unmatched /admin/* routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AdminAuthProvider>
  );
}
