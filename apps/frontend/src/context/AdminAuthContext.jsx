/**
 * AdminAuthContext.jsx
 * Mock authentication for the admin panel — completely separate from the
 * customer app's AuthContext (different session, different gate). No real
 * backend: "login" just checks against a hardcoded admin list and stores
 * the session in localStorage so a page refresh doesn't kick you out.
 *
 * Wrap AdminRoutes with <AdminAuthProvider> once, at the top level.
 */
import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../lib/api-client";

export const AdminAuthContext = createContext(null);

const STORAGE_KEY = "admin_session";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const session = JSON.parse(saved);
        setAdmin(session);
        if (session.permissions) {
          setPermissions(session.permissions);
        }
        
        // Refresh permissions in the background on restore
        apiClient
          .get("/auth/me/permissions")
          .then((response) => {
            const freshPerms = response.data.permissions;
            setPermissions(freshPerms);
            session.permissions = freshPerms;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          })
          .catch((err) => {
            console.error("Failed to refresh admin permissions:", err);
          })
          .finally(() => {
            setLoading(false);
          });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { user, accessToken, refreshToken } = response.data;

      const ADMIN_ELIGIBLE_ROLES = ["account_manager", "super_admin", "designer", "reviewer", "support_staff"];
      if (!ADMIN_ELIGIBLE_ROLES.includes(user.role)) {
        return {
          success: false,
          error: "Access denied. You do not have administrator privileges.",
        };
      }

      const permissionsMap = user.permissions || {};

      const session = {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        permissions: permissionsMap,
        accessToken,
        refreshToken,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setAdmin(session);
      setPermissions(permissionsMap);
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || "Invalid email or password.";
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAdmin(null);
    setPermissions(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{ admin, isAuthenticated: !!admin, loading, permissions, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

