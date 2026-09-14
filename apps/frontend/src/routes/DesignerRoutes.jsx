/**
 * DesignerRoutes.jsx
 * Isolated designer portal — mirrors AdminRoutes pattern.
 * Mounted in AppRoutes as <Route path="/designer/*" element={<DesignerRoutes/>}/>
 */
import { Routes, Route, Navigate } from "react-router-dom";
import { DesignerAuthProvider } from "../context/DesignerAuthContext";
import RequireDesignerAuth from "./RequireDesignerAuth";
import DesignerLayout from "../layouts/DesignerLayout";

// Auth
import DesignerLogin from "../pages/Designer/Auth/DesignerLogin";
import DesignerRegister from "../pages/Designer/Auth/DesignerRegister";
import DesignerVerifyEmail from "../pages/Designer/Auth/DesignerVerifyEmail";
import DesignerActivate from "../pages/Designer/Auth/DesignerActivate";
import DesignerForgotPassword from "../pages/Designer/Auth/DesignerForgotPassword";
import DesignerResetPassword from "../pages/Designer/Auth/DesignerResetPassword";

// App
import DesignerDashboard from "../pages/Designer/Dashboard";
import DesignerTasks from "../pages/Designer/Tasks";
import DesignerSubmissions from "../pages/Designer/Submissions";
import DesignerImageToCode from "../pages/Designer/ImageToCode";
import DesignerPayments from "../pages/Designer/Payments";
import DesignerSettings from "../pages/Designer/Settings";
import DesignerNotifications from "../pages/Designer/Notifications";
import NotFound from "../pages/NotFound";

export default function DesignerRoutes() {
  return (
    <DesignerAuthProvider>
      <Routes>
        {/* Auth — outside layout */}
        <Route path="register" element={<DesignerRegister />} />
        <Route path="login" element={<DesignerLogin />} />
        <Route path="verify-email" element={<DesignerVerifyEmail />} />
        <Route path="activate" element={<DesignerActivate />} />
        <Route path="forgot-password" element={<DesignerForgotPassword />} />
        <Route path="reset-password" element={<DesignerResetPassword />} />

        {/* Protected — inside layout */}
        <Route
          element={
            <RequireDesignerAuth>
              <DesignerLayout />
            </RequireDesignerAuth>
          }
        >
          <Route index element={<DesignerDashboard />} />
          <Route path="tasks" element={<DesignerTasks />} />
          <Route path="submissions" element={<DesignerSubmissions />} />
          <Route path="image-to-code" element={<DesignerImageToCode />} />
          <Route path="activity" element={<Navigate to="/designer/submissions" replace />} />
          <Route path="payments" element={<DesignerPayments />} />
          <Route path="settings" element={<DesignerSettings />} />
          <Route path="notifications" element={<DesignerNotifications />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </DesignerAuthProvider>
  );
}
