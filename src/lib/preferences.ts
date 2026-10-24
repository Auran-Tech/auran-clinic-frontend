export type AppLanguage = 'en' | 'ar'
export type AppTheme = 'dark' | 'light'

const languageKey = 'auran.language'
const themeKey = 'auran.theme'

function readPreference(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writePreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // The current preference remains usable when browser storage is unavailable.
  }
}

export function getLanguagePreference(): AppLanguage {
  return readPreference(languageKey) === 'ar' ? 'ar' : 'en'
}

export function setLanguagePreference(language: AppLanguage) {
  writePreference(languageKey, language)
}

export function getThemePreference(): AppTheme {
  return readPreference(themeKey) === 'light' ? 'light' : 'dark'
}

export function setThemePreference(theme: AppTheme) {
  writePreference(themeKey, theme)
}
