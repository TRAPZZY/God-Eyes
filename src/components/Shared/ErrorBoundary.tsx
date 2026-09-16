import { Component, ReactNode } from 'react'
import { AlertTriangle, LogIn, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex h-full items-center justify-center bg-[#0b0f17] p-8">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/80 p-8 text-left shadow-2xl shadow-black/30">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
            </div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-white">We couldn’t load this workspace.</h2>
            <p className="mb-6 text-sm leading-6 text-slate-400">
              The connection was interrupted while God Eyes was loading your data. Try again, or sign in again if your session expired.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.assign('/login')
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
              >
                <LogIn className="h-4 w-4" />
                Go to sign in
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function withErrorBoundary<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
