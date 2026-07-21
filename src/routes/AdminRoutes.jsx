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
import AdminLayout from "../layouts/AdminLayout";

// --- Pascal's pages ---
import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers from "../pages/admin/Users";
import AdminUserDetail from "../pages/admin/UserDetail";
import AdminContentCalendar from "../pages/admin/ContentCalendar";
import AdminAIContent from "../pages/admin/AIContent";
import AdminNotifications from "../pages/admin/Notifications";
import AdminAuditLogs from "../pages/admin/AuditLogs";

// --- Treasure's pages ---
import AdminBilling from "../pages/admin/Billing";
import AdminSocialAccounts from "../pages/admin/SocialAccounts";
import AdminUploads from "../pages/admin/Uploads";
import AdminAnalytics from "../pages/admin/Analytics";
import AdminAIConfig from "../pages/admin/AIConfig";
import AdminSupport from "../pages/admin/Support";
import AdminSettings from "../pages/admin/Settings";

// --- Auth (shared) ---
import AdminLogin from "../pages/admin/AdminLogin";

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Admin auth screens sit OUTSIDE AdminLayout (no sidebar) */}
      <Route path="login" element={<AdminLogin />} />

      {/* Everything else sits inside the admin shell (sidebar + navbar) */}
      <Route element={<AdminLayout />}>
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
    </Routes>
  );
}
