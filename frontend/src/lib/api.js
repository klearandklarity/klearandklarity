import axios from 'axios'

// Local dev: Vite proxies /api to localhost:8080 (see vite.config.js).
// Deployed: set VITE_API_URL to the backend origin, e.g.
// https://klear-and-klarity-api.zeabur.zeabur.app/api
const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  // Spring binds repeatable @RequestParam values only when the key is repeated
  // verbatim, so avoid axios' default `categories[]=value` form.
  paramsSerializer: {
    serialize: (params) => {
      const search = new URLSearchParams()
      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (Array.isArray(value)) {
          value.forEach((entry) => search.append(key, entry))
        } else {
          search.append(key, value)
        }
      })
      return search.toString()
    },
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('klearity_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    // Session expired or account disabled: clear it so the UI falls back to the login page.
    if (status === 401 && localStorage.getItem('klearity_token')) {
      localStorage.removeItem('klearity_token')
      localStorage.removeItem('klearity_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.dispatchEvent(new CustomEvent('klearity:unauthorized'))
      }
    }
    return Promise.reject(error)
  },
)

/** Turns any axios failure into a single readable sentence. */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data
  if (data?.message) return data.message
  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Is the backend running on port 8080?'
  }
  return fallback
}

/** Field-level validation errors returned by the backend, if any. */
export function fieldErrors(error) {
  return error?.response?.data?.fields ?? {}
}

export default api
