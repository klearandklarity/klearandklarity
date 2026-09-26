import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from './api'

const DEFAULTS = {
  companyName: 'Klear And Klarity',
  tagline: 'Career clarity for every student, right after Class 10.',
  aboutText: '',
  contactEmail: 'support@klearity.com',
  contactPhone: '',
  address: '',
  logoPath: '/logo.jpeg',
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/public/settings')
      setSettings({ ...DEFAULTS, ...data })
    } catch {
      /* keep the current values, the site must still render if the API is down */
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // The settings are spread flat so pages can read `useSettings().companyName`,
  // with `refresh` attached for the admin screen that edits them.
  const value = { ...settings, refresh }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  return useContext(SettingsContext) ?? DEFAULTS
}
