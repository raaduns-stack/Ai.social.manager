import { createContext, useContext, useState } from 'react'

/**
 * Placeholder auth/subscription state.
 * Replace the fake values with real API calls once the backend exists.
 * Used later to guard /dashboard/* routes (no free tier — must be subscribed).
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // { name, email, ... } | null
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  const value = { user, setUser, hasActiveSubscription, setHasActiveSubscription }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
