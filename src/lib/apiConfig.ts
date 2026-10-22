const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!configuredBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required.')
}

export const apiBaseUrl: string = configuredBaseUrl
const pageOrigin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin
export const readyUrl = new URL('/health/ready', new URL(apiBaseUrl, pageOrigin)).toString()
