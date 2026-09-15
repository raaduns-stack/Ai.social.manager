/**
 * DesignerAuthContext.jsx
 * Isolated auth for Designer Portal — separate session storage from
 * customer (auth_session) and admin (admin_session). Mirrors AuthContext pattern
 * but routes through POST /auth/designer/register and verifies via /auth/verify-email.
 */
import { createContext, useEffect, useState } from "react";
import apiClient from "../lib/api-client";

export const DesignerAuthContext = createContext(null);

const STORAGE_KEY = "designer_session";

export function DesignerAuthProvider({ children }) {
  const [designer, setDesigner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const session = JSON.parse(saved);
        setDesigner(session);
        apiClient
          .get("/auth/me")
          .catch(() => {})
          .finally(() => setLoading(false));
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

      if (response.data?.requiresVerification) {
        return {
          success: false,
          requiresVerification: true,
          email: response.data.email || email,
        };
      }

      const { user, accessToken, refreshToken } = response.data;

      if (!user || user.role !== "designer") {
        return {
          success: false,
          error: "Access denied. This portal is for graphic designers only.",
        };
      }

      const session = {
        id: user.id,
        email: user.email,
        name: user.fullName || user.name || user.email,
        role: user.role,
        avatar: user.avatar || null,
        accessToken,
        refreshToken,
        rawUser: user,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setDesigner(session);
      return { success: true };
    } catch (err) {
      if (err?.requiresVerification || err?.errorCode === "EMAIL_NOT_VERIFIED") {
        return {
          success: false,
          requiresVerification: true,
          email: err?.email || email,
        };
      }
      const msg = err?.message || err?.error || "Invalid email or password.";
      return { success: false, error: msg };
    }
  };

  const register = async (email, password, fullName) => {
    const response = await apiClient.post("/auth/designer/register", { email, password, fullName });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDesigner(null);
  };

  const patchSession = (patch) => {
    setDesigner((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage full/blocked — in-memory session still updates.
      }
      return next;
    });
  };

  const activate = async ({ token, fullName, password }) => {
    try {
      const response = await apiClient.post("/auth/designer/activate", { token, fullName, password });
      const { user, accessToken, refreshToken } = response.data;
      const session = {
        id: user.id,
        email: user.email,
        name: user.fullName || user.name || user.email,
        role: user.role,
        accessToken,
        refreshToken,
        rawUser: user,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setDesigner(session);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Activation failed. Link may be expired." };
    }
  };

  return (
    <DesignerAuthContext.Provider
      value={{ designer, isAuthenticated: !!designer, loading, login, register, logout, activate, patchSession }}
    >
      {children}
    </DesignerAuthContext.Provider>
  );
}
