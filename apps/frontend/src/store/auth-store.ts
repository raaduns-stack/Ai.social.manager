import { create } from 'zustand';
import { User } from '@socialpilot/shared-types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User | null, accessToken: string | null, refreshToken: string | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const SESSION_KEY = 'auth_session';

const getInitialSession = () => {
  const saved = localStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }
  return { user: null, accessToken: null, refreshToken: null };
};

const initialSession = getInitialSession();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialSession.user,
  accessToken: initialSession.accessToken,
  refreshToken: initialSession.refreshToken,
  setAuth: (user, accessToken, refreshToken) => {
    console.log('auth-store setAuth - storing tokens', { accessToken, refreshToken });
    if (user && accessToken && refreshToken) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ user, accessToken, refreshToken })
      );
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    set({ user, accessToken, refreshToken });
  },
  setTokens: (accessToken, refreshToken) => {
    console.log('auth-store setTokens - refreshing tokens', { accessToken, refreshToken });
    set((state) => {
      const updated = { ...state, accessToken, refreshToken };
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          user: updated.user,
          accessToken,
          refreshToken,
        })
      );
      return updated;
    });
  },
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
