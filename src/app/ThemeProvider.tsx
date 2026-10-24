import { useLayoutEffect, useState, type PropsWithChildren } from 'react'
import { setThemePreference } from '../lib/preferences'
import { getStoredTheme, ThemeContext, type Theme } from './themeState'
import primeDarkThemeUrl from 'primereact/resources/themes/lara-dark-blue/theme.css?url'
import primeLightThemeUrl from 'primereact/resources/themes/lara-light-blue/theme.css?url'

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  useLayoutEffect(() => {
    let primeTheme = document.querySelector<HTMLLinkElement>('#auran-prime-theme')
    if (!primeTheme) {
      primeTheme = document.createElement('link')
      primeTheme.id = 'auran-prime-theme'
      primeTheme.rel = 'stylesheet'
      document.head.insertBefore(primeTheme, document.head.firstChild)
    }
    primeTheme.href = theme === 'light' ? primeLightThemeUrl : primeDarkThemeUrl
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
