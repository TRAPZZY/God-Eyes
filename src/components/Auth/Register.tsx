import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, Loader2, UserPlus } from 'lucide-react'
import { useAuthActions } from '@convex-dev/auth/react'

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  })
  const [validationError, setValidationError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { signIn } = useAuthActions()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setValidationError(null)
    setError(null)

    if (!form.email.includes('@')) {
      setValidationError('Enter a valid email address.')
      return
    }
    if (form.username.length < 3) {
      setValidationError('Your display name must have at least 3 characters.')
      return
    }
    if (form.password.length < 8) {
      setValidationError('Your password must have at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setValidationError('The passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const authParams = {
        email: form.email,
        username: form.username,
        password: form.password,
        flow: 'signUp',
        ...(form.full_name ? { fullName: form.full_name } : {}),
      }

      await signIn('password', {
        ...authParams,
      })
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to create your account right now.'
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
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Start with a workspace</p>
            <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-0.045em] text-stone-50 xl:text-6xl">
              Keep the signal, leave out the noise.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
              Create an account to organize the places you follow and the observations that matter to you.
            </p>
          </div>

          <p className="max-w-sm text-xs leading-5 text-slate-500">
            You can begin with a small set of locations and build a clearer history as your workspace grows.
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
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Create an account</p>
              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-stone-50">Set up your workspace</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">A few details now give your account a clear, recognizable identity.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || validationError) && (
                <div role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm leading-5 text-red-200">
                  {validationError || error}
                </div>
              )}

              <div>
                <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-slate-200">Email address</label>
                <input
                  id="register-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="w-full rounded-xl border border-white/[0.11] bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="register-display-name" className="mb-2 block text-sm font-medium text-slate-200">Display name</label>
                <input
                  id="register-display-name"
                  type="text"
                  value={form.username}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  className="w-full rounded-xl border border-white/[0.11] bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10"
                  placeholder="How you want to appear"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="register-fullname" className="mb-2 block text-sm font-medium text-slate-200">Full name <span className="font-normal text-slate-500">(optional)</span></label>
                <input
                  id="register-fullname"
                  type="text"
                  value={form.full_name}
                  onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                  className="w-full rounded-xl border border-white/[0.11] bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                <input
                  id="register-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="w-full rounded-xl border border-white/[0.11] bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10"
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label htmlFor="register-confirm" className="mb-2 block text-sm font-medium text-slate-200">Confirm password</label>
                <input
                  id="register-confirm"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  className="w-full rounded-xl border border-white/[0.11] bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {isLoading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <div className="mt-8 border-t border-white/[0.08] pt-6">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="inline-flex items-center gap-1 font-medium text-blue-300 transition hover:text-blue-200">
                  Sign in <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
