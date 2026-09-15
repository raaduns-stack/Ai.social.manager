/**
 * RequireDesignerAuth.jsx
 * Guards /designer/* protected routes. Mirrors RequireAdminAuth pattern.
 */
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useDesignerAuth } from "../context/useDesignerAuth";

export default function RequireDesignerAuth({ children }) {
  const { isAuthenticated, loading } = useDesignerAuth();
  const location = useLocation();

  if (loading) {
    // Branded hold — never flash-redirect to /login while session restore runs.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F9FAFB]">
        <p className="text-[15px] font-bold tracking-tight text-[#111827]">
          Designer<span className="text-[#FF6600]">.</span>
        </p>
        <Loader2 size={20} className="animate-spin text-[#FF6600]" aria-hidden />
        <p className="text-xs text-[#6B7280]">Loading your workspace…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/designer/login" state={{ from: location }} replace />;
  }

  return children;
}
