import { useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/api'
import { tokenStorage } from '../services/storage'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const acceptSession = useCallback((session) => { tokenStorage.set(session); setUser(session.user) }, [])
  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh(); tokenStorage.clear(); setUser(null)
    if (refresh) { try { await authService.logout(refresh) } catch { /* Local sign out still succeeds. */ } }
  }, [])
  useEffect(() => {
    const expired = () => { tokenStorage.clear(); setUser(null) }
    window.addEventListener('auth:expired', expired)
    const restore = async () => {
      if (!tokenStorage.getAccess() && !tokenStorage.getRefresh()) { setLoading(false); return }
      try { setUser(await authService.currentUser()) } catch { tokenStorage.clear(); setUser(null) }
      finally { setLoading(false) }
    }
    restore()
    return () => window.removeEventListener('auth:expired', expired)
  }, [])
  const value = useMemo(() => ({
    user,
    loading,
    login: async (values) => {
      const session = await authService.login(values)
      acceptSession(session)
      return session.user
    },
    register: async (values) => {
      const session = await authService.register(values)
      acceptSession(session)
      return session.user
    },
    logout,
  }), [user, loading, acceptSession, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
