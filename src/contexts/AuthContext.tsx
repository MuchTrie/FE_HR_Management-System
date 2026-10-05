import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AuthUser, Role } from '../types'
import { setToken, setUser, setRefreshToken, clearAuth, getToken, getUser, getRefreshToken } from '../lib/auth'
import { login as apiLogin, logout as apiLogout } from '../lib/api'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (role: Role | Role[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(getUser)
  const [token, setTokenState] = useState<string | null>(getToken)

  const login = useCallback(async (email: string, password: string) => {
    const { token: newToken, refresh_token, user: newUser } = await apiLogin(email, password)
    setToken(newToken)
    setRefreshToken(refresh_token)
    setUser(newUser)
    setTokenState(newToken)
    setUserState(newUser)
  }, [])

  const handleLogout = useCallback(() => {
    void apiLogout(getRefreshToken()).catch(() => undefined)
    clearAuth()
    setTokenState(null)
    setUserState(null)
  }, [])

  const hasRole = useCallback((role: Role | Role[]): boolean => {
    if (!user) return false
    if (Array.isArray(role)) return role.includes(user.role)
    return user.role === role
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token && !!user,
      login,       logout: handleLogout, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
