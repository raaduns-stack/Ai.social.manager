/**
 * NotFound.jsx
 * Catch-all for unmatched routes.
 */
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { AdminAuthContext } from "../context/AdminAuthContext";

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const adminCtx = useContext(AdminAuthContext);

  const hasAdminSession = !!localStorage.getItem("admin_session");
  const isAdmin = (adminCtx && adminCtx.isAuthenticated) || hasAdminSession;
  const isLoggedIn = !!user || isAdmin;

  const isAdminPath = window.location.pathname.startsWith("/admin");

  const handleBack = () => {
    if (isLoggedIn) {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      } else {
        navigate(isAdmin ? "/admin/dashboard" : "/dashboard");
      }
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-semibold text-[#FF6600]">404</p>
      <h1 className="mt-2 text-lg font-semibold text-[#111827]">Page not found</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        {isAdminPath
          ? "The admin page you're looking for doesn't exist."
          : "The page you're looking for doesn't exist."}
      </p>
      <button
        onClick={handleBack}
        className="mt-6 rounded-lg bg-[#FF6600] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e05b00]"
      >
        {isLoggedIn ? "Back to Dashboard" : "Back to Home"}
      </button>
    </div>
  );
}
