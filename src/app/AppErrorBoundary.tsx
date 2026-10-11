import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react'

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application render error', error, info)
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="fatal-error">
        <section className="panel fatal-error-card">
          <p className="eyebrow">Auran Clinic</p>
          <h1>Something went wrong</h1>
          <p className="muted">
            The page encountered an unexpected error. Reload the application to restore a clean state.
          </p>
          <button className="button primary" onClick={() => window.location.reload()}>
            Reload application
          </button>
        </section>
      </main>
    )
  }
}
