import { createContext, useContext } from 'react'
import { getThemePreference, type AppTheme } from '../lib/preferences'

export type Theme = AppTheme

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function getStoredTheme(): Theme {
  return getThemePreference()
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('ThemeProvider is required')
  return context
}
