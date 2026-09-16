import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import './index.css'
import App from './App'

const convexUrl = import.meta.env.VITE_CONVEX_URL
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null

function MissingConfiguration() {
  return (
    <main className="auth-shell flex min-h-screen items-center justify-center px-6 py-10">
      <section className="auth-panel w-full max-w-2xl rounded-2xl border border-white/[0.08] p-8 text-left shadow-2xl sm:p-10">
        <div className="auth-mark mb-8 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-sm font-semibold text-white">
          GE
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Configuration required
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-50">
            God Eyes needs its backend URL before it can start.
          </h1>
          <p className="text-sm leading-6 text-slate-400">
            Add the Convex deployment URL as <code>VITE_CONVEX_URL</code> in the
            project environment, then rebuild the application.
          </p>
        </div>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {convex ? (
      <ConvexAuthProvider client={convex}>
        <App />
      </ConvexAuthProvider>
    ) : (
      <MissingConfiguration />
    )}
  </StrictMode>,
)
