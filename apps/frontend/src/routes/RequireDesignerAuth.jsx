/**
 * RequireDesignerAuth.jsx
 * Guards /designer/* protected routes. Mirrors RequireAdminAuth pattern.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useDesignerAuth } from "../context/useDesignerAuth";

export default function RequireDesignerAuth({ children }) {
  const { isAuthenticated, loading } = useDesignerAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/designer/login" state={{ from: location }} replace />;
  }

  return children;
}
