/**
 * RequireAdminAuth.jsx
 * Wraps protected admin routes. If there's no admin session, redirect to
 * /admin/login and remember where they were headed so login can send them
 * back after success.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function RequireAdminAuth({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    // Avoid a flash-redirect to /login while session restore is in progress
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
