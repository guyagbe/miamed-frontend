import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('miamed_token')
    if (!token) { setLoading(false); return }
    api.auth.me()
      .then(setUser)
      .catch(() => { localStorage.removeItem('miamed_token'); localStorage.removeItem('miamed_refresh') })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api.auth.login({ email, password })
    localStorage.setItem('miamed_token', data.access_token)
    localStorage.setItem('miamed_refresh', data.refresh_token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (body) => {
    const data = await api.auth.register(body)
    localStorage.setItem('miamed_token', data.access_token)
    localStorage.setItem('miamed_refresh', data.refresh_token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => {})
    localStorage.removeItem('miamed_token')
    localStorage.removeItem('miamed_refresh')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
