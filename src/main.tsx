import './base.css'
import './theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import './app/PrimeFields.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { App } from './app/App'
import { AppErrorBoundary } from './app/AppErrorBoundary'
import { ThemeProvider } from './app/ThemeProvider'
import { ConnectionGate } from './features/connectivity/ConnectionGate'
import './i18n'
import { AuthProvider } from './features/auth/AuthContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ConnectionGate>
              <AppErrorBoundary>
                <App />
              </AppErrorBoundary>
            </ConnectionGate>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
