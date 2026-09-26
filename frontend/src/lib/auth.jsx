import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { errorMessage, fieldErrors } from './api'

const TOKEN_KEY = 'klearity_token'
const USER_KEY = 'klearity_user'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [checking, setChecking] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))

  const persist = useCallback((token, nextUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  // Re-validate the stored token on first load so a revoked or expired
  // session never leaves a stale user in the UI.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setChecking(false)
      return
    }
    let cancelled = false
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (cancelled) return
        localStorage.setItem(USER_KEY, JSON.stringify(data))
        setUser(data)
      })
      .catch(() => {
        if (!cancelled) clear()
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [clear])

  // The axios interceptor fires this when it drops an expired token.
  useEffect(() => {
    const onUnauthorized = () => clear()
    window.addEventListener('klearity:unauthorized', onUnauthorized)
    return () => window.removeEventListener('klearity:unauthorized', onUnauthorized)
  }, [clear])

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password })
      persist(data.token, data.user)
      return data.user
    },
    [persist],
  )

  const refresh = useCallback(async () => {
    const { data } = await api.get('/auth/me')
    localStorage.setItem(USER_KEY, JSON.stringify(data))
    setUser(data)
    return data
  }, [])

  const logout = useCallback(() => clear(), [clear])

  const value = useMemo(
    () => ({
      user,
      checking,
      isLoggedIn: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      isStudent: user?.role === 'STUDENT',
      isEmployee: user?.role === 'EMPLOYEE',
      needsOnboarding:
        Boolean(user) && user.role !== 'ADMIN' && !user.onboardingCompleted,
      login,
      logout,
      refresh,
      setUser,
    }),
    [user, checking, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

/** Wraps an async submit with busy state, an error message and field-level errors. */
export function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})

  const run = useCallback(async (fn) => {
    setBusy(true)
    setError('')
    setFields({})
    try {
      return await fn()
    } catch (e) {
      setError(errorMessage(e))
      setFields(fieldErrors(e))
      return null
    } finally {
      setBusy(false)
    }
  }, [])

  const clearField = useCallback((name) => {
    setFields((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }, [])

  return { busy, error, setError, fields, setFields, clearField, run }
}
