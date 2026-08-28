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
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import RequireAdminAuth from "./RequireAdminAuth";
import RequirePermissionGuard from "./RequirePermissionGuard";
import AdminLayout from "../layouts/AdminLayout";

// --- Pascal's pages ---
import AdminDashboard from "../pages/Admin/Dashboard";
import AdminUsers from "../pages/Admin/Users";
import AdminUserDetail from "../pages/Admin/UserDetail";
import AdminContentCalendar from "../pages/Admin/ContentCalendar";
import UserContentCalendar from "../pages/Admin/UserContentCalendar";
import AdminAIContent from "../pages/Admin/AIContent";
import AdminNotifications from "../pages/Admin/Notifications";
import AdminAuditLogs from "../pages/Admin/AuditLogs";
import StaffDashboard from "../pages/Admin/staff/StaffDashboard";
import ManageStaff from "../pages/Admin/staff/ManageStaff";
import RolesPermissions from "../pages/Admin/staff/RolesPermissions";
import LoginHistory from "../pages/Admin/staff/LoginHistory";
import ActivityLogs from "../pages/Admin/staff/ActivityLogs";

// --- Treasure's pages ---
import AdminBilling from "../pages/Admin/Billing";
import AdminMoneyManagement from "../pages/Dashboard/MoneyManagement";
import AdminSocialAccounts from "../pages/Admin/SocialAccounts";
import AdminUploads from "../pages/Admin/Uploads";
import AdminAnalytics from "../pages/Admin/Analytics";
import AdminAIConfig from "../pages/Admin/AIConfiguration";
import AdminSupport from "../pages/Admin/Support";
import AdminFaqs from "../pages/Admin/Faqs";
import AdminSettings from "../pages/Admin/Settings";
import AdminKyc from "../pages/Admin/Kyc";
import AccessRestricted from "../pages/Admin/AccessRestricted";

// --- Auth (shared) ---
import AdminLogin from "../pages/Admin/AdminLogin";
import AdminForgotPassword from "../pages/Admin/AdminForgotPassword";
import NotFound from "../pages/NotFound";

export default function AdminRoutes() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');

    return () => {
      const metaToRemove = document.querySelector('meta[name="robots"]');
      if (metaToRemove) {
        metaToRemove.parentNode?.removeChild(metaToRemove);
      }
    };
  }, []);

  return (
    <AdminAuthProvider>
      <Routes>
        {/* Admin auth screens sit OUTSIDE AdminLayout (no sidebar) */}
        <Route path="login" element={<AdminLogin />} />
        <Route path="forgot-password" element={<AdminForgotPassword />} />

        {/* Everything else sits inside the admin shell (sidebar + navbar) */}
        <Route
          element={
            <RequireAdminAuth>
              <AdminLayout />
            </RequireAdminAuth>
          }
        >
          <Route index element={<RequirePermissionGuard module="dashboard"><AdminDashboard /></RequirePermissionGuard>} />
          <Route path="dashboard" element={<RequirePermissionGuard module="dashboard"><AdminDashboard /></RequirePermissionGuard>} />

          {/* User Management (Pascal) */}
          <Route path="users" element={<RequirePermissionGuard module="user_management"><AdminUsers /></RequirePermissionGuard>} />
          <Route path="users/:userId" element={<RequirePermissionGuard module="user_management"><AdminUserDetail /></RequirePermissionGuard>} />
          <Route path="users/:userId/calendar" element={<RequirePermissionGuard module="user_management"><UserContentCalendar /></RequirePermissionGuard>} />

          {/* Content Calendar + AI Content (Pascal) */}
          <Route path="calendar" element={<RequirePermissionGuard module="content_calendar"><AdminContentCalendar /></RequirePermissionGuard>} />
          <Route path="ai-content" element={<RequirePermissionGuard module="content_creation"><AdminAIContent /></RequirePermissionGuard>} />

          {/* Notifications + Audit Logs (Pascal) */}
          <Route path="notifications" element={<RequirePermissionGuard module="notification_management"><AdminNotifications /></RequirePermissionGuard>} />
          <Route path="logs" element={<RequirePermissionGuard module="audit_logs"><AdminAuditLogs /></RequirePermissionGuard>} />
          <Route path="staff" element={<RequirePermissionGuard module="staff_management"><StaffDashboard /></RequirePermissionGuard>} />
          <Route path="staff/manage" element={<RequirePermissionGuard module="staff_management"><ManageStaff /></RequirePermissionGuard>} />
          <Route path="staff/roles-permissions" element={<RequirePermissionGuard module="staff_management"><RolesPermissions /></RequirePermissionGuard>} />
          <Route path="staff/login-history" element={<RequirePermissionGuard module="audit_logs"><LoginHistory /></RequirePermissionGuard>} />
          <Route path="staff/activity-logs" element={<RequirePermissionGuard module="audit_logs"><ActivityLogs /></RequirePermissionGuard>} />

          {/* Billing + Social Accounts + Uploads (Treasure) */}
          <Route path="billing" element={<RequirePermissionGuard module="billing"><AdminBilling /></RequirePermissionGuard>} />
          <Route path="social-accounts" element={<RequirePermissionGuard module="social_accounts"><AdminSocialAccounts /></RequirePermissionGuard>} />
          <Route path="uploads" element={<RequirePermissionGuard module="upload_management"><AdminUploads /></RequirePermissionGuard>} />
          <Route path="kyc" element={<RequirePermissionGuard module="user_management"><AdminKyc /></RequirePermissionGuard>} />

          {/* Money Management (Treasure) */}
          <Route path="money-management" element={<RequirePermissionGuard module="money_management"><AdminMoneyManagement /></RequirePermissionGuard>} />

          {/* Analytics + AI Config (Treasure) */}
          <Route path="analytics" element={<RequirePermissionGuard module="analytics"><AdminAnalytics /></RequirePermissionGuard>} />
          <Route path="ai-config" element={<RequirePermissionGuard module="ai_config"><AdminAIConfig /></RequirePermissionGuard>} />

          {/* Support + Settings (Treasure) */}
          <Route
            path="support"
            element={
              <RequirePermissionGuard module="support">
                <AdminSupport />
              </RequirePermissionGuard>
            }
          />
          <Route
            path="faqs"
            element={
              <RequirePermissionGuard module="support">
                <AdminFaqs />
              </RequirePermissionGuard>
            }
          />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="access-restricted" element={<AccessRestricted />} />
        </Route>

        {/* Catch-all 404 for unmatched /admin/* routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AdminAuthProvider>
  );
}

