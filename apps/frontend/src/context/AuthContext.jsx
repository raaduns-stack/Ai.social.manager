import { createContext, useContext, useEffect, useState } from 'react'
import apiClient from '../lib/api-client'
import { useAuthStore } from '../store/auth-store'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const store = useAuthStore()

  const [user, setUser] = useState(store.user)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  // Sync React state with Zustand store
  useEffect(() => {
    setUser(store.user)
  }, [store.user])

  // Fetch subscription from backend to determine hasActiveSubscription
  const checkSubscription = async () => {
    if (!store.accessToken) {
      setHasActiveSubscription(false)
      return
    }
    try {
      const response = await apiClient.get('/subscription')
      const sub = response.data
      setHasActiveSubscription(sub && sub.status === 'active')
    } catch (err) {
      setHasActiveSubscription(false)
    }
  }

  useEffect(() => {
    if (store.user) {
      checkSubscription()
    } else {
      setHasActiveSubscription(false)
    }
  }, [store.user, store.accessToken])

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password })
    const { user: loggedInUser, accessToken, refreshToken } = response.data
    store.setAuth(loggedInUser, accessToken, refreshToken)
    return loggedInUser
  }

  const register = async (email, password, fullName, businessName) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      fullName,
      businessName,
    })
    const { user: registeredUser, accessToken, refreshToken } = response.data
    store.setAuth(registeredUser, accessToken, refreshToken)
    return registeredUser
  }

  const refresh = async () => {
    if (!store.refreshToken) return null
    const response = await apiClient.post(
      '/auth/refresh',
      { refreshToken: store.refreshToken },
      {
        headers: {
          Authorization: `Bearer ${store.refreshToken}`,
        },
      }
    )
    const { accessToken, refreshToken: newRefreshToken } = response.data
    store.setTokens(accessToken, newRefreshToken || store.refreshToken)
    return accessToken
  }

  const logout = () => {
    store.logout()
  }

  const value = {
    user,
    setUser: (u) => store.setAuth(u, store.accessToken, store.refreshToken),
    hasActiveSubscription,
    setHasActiveSubscription,
    login,
    register,
    refresh,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
