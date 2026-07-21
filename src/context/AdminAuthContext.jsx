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

const AdminAuthContext = createContext(null);

const STORAGE_KEY = "admin_session";

// Mock admin accounts — stand-in for a real backend user table.
const MOCK_ADMINS = [
  { email: "pascal@raaduns.com", password: "admin123", name: "Pascal", role: "Admin" },
  { email: "treasure@raaduns.com", password: "admin123", name: "Treasure", role: "Admin" },
];

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAdmin(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simulated network delay so the login button's loading state has something to show
    await new Promise((r) => setTimeout(r, 500));

    const match = MOCK_ADMINS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );

    if (!match) {
      return { success: false, error: "Invalid email or password." };
    }

    const session = { email: match.email, name: match.name, role: match.role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setAdmin(session);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{ admin, isAuthenticated: !!admin, loading, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  }
  return ctx;
}
