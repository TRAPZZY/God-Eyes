import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, Loader2, ShieldCheck } from 'lucide-react'
import { useAuthActions } from '@convex-dev/auth/react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { signIn } = useAuthActions()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn('password', { email, password, flow: 'signIn' })
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to sign in right now.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_30rem]">
        <section className="hidden min-h-screen flex-col justify-between px-12 py-12 lg:flex xl:px-16 xl:py-14">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-tight text-white">
            <span className="auth-mark flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white">
              <Eye className="h-5 w-5" />
            </span>
            God Eyes
          </div>

          <div className="max-w-xl pb-12">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Intelligence workspace</p>
            <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-0.045em] text-stone-50 xl:text-6xl">
              A clearer view of the places that matter.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
              Bring locations, captures, and changes into one focused operational workspace.
            </p>
          </div>

          <p className="max-w-sm text-xs leading-5 text-slate-500">
            Your workspace is organized around the information you add and manage—not simulated activity or status indicators.
          </p>
        </section>

        <main className="auth-panel flex min-h-screen items-center border-l border-white/[0.07] px-6 py-10 sm:px-10 lg:px-12">
          <div className={`mx-auto w-full max-w-sm transition-all duration-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="auth-mark flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white">
                <Eye className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-white">God Eyes</span>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Welcome back</p>
              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-stone-50">Sign in to your workspace</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">Use the email address and password associated with your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm leading-5 text-red-200">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-200">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-white/[0.11] bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/[0.11] bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-8 border-t border-white/[0.08] pt-6">
              <p className="text-sm text-slate-400">
                New to God Eyes?{' '}
                <Link to="/register" className="font-medium text-blue-300 transition hover:text-blue-200">Create an account</Link>
              </p>
              <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                Account access will be protected by the security upgrades now in progress.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
