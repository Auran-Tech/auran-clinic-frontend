import { useLayoutEffect, useState, type PropsWithChildren } from 'react'
import { setThemePreference } from '../lib/preferences'
import { getStoredTheme, ThemeContext, type Theme } from './themeState'

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#e4e7ee' : '#070d1c')
    setThemePreference(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  )
}
