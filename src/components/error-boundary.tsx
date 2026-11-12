import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './ui'

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('The app hit an unexpected error.', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
          <div className="card w-full max-w-lg p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fbe9e8] text-danger">
              <AlertTriangle size={20} />
            </span>
            <h1 className="mt-3 text-lg font-bold">Something went wrong on this screen</h1>
            <p className="mt-1 text-sm text-muted">
              Your saved business data is unaffected. Reload the app to continue. If the problem repeats, export a
              backup as soon as the app opens normally so your records are safe.
            </p>
            <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-canvas p-3 text-[11px] text-[#5c5854]">
              {this.state.error.message}
            </pre>
            <div className="mt-4 flex gap-2">
              <Button variant="primary" onClick={() => window.location.reload()}>
                Reload app
              </Button>
              <Button onClick={() => this.setState({ error: null })}>Try this screen again</Button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
