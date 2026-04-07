import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, Shield, UserPlus, Crosshair } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

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

  const signUp = useMutation(api.auth.signUp)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setError(null)

    if (!form.email.includes('@')) {
      setValidationError('Invalid email address')
      return
    }
    if (form.username.length < 3) {
      setValidationError('Callsign must be at least 3 characters')
      return
    }
    if (form.password.length < 8) {
      setValidationError('Access code must be at least 8 characters')
      return
    }
    if (form.password !== form.confirmPassword) {
      setValidationError('Access codes do not match')
      return
    }

    setLoading(true)
    try {
      await signUp({
        email: form.email,
        username: form.username,
        password: form.password,
        fullName: form.full_name || undefined,
      })
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/50 via-gray-950 to-blue-950/50 pointer-events-none" />

      <div className={`relative z-10 w-full max-w-md px-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-wider text-white mb-2">
            GOD <span className="text-blue-400">EYES</span>
          </h1>
          <p className="text-sm font-medium tracking-widest text-blue-400/80 uppercase mb-3">
            Operator Registration
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">New Operator Credentials</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || validationError) && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {validationError || error}
              </div>
            )}

            <div>
              <label htmlFor="register-email" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                id="register-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                placeholder="operator@agency.gov"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="register-callsign" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Callsign
              </label>
              <input
                id="register-callsign"
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                placeholder="operator_callsign"
                required
              />
            </div>

            <div>
              <label htmlFor="register-fullname" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Full Name (Optional)
              </label>
              <input
                id="register-fullname"
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                placeholder="Full designation"
              />
            </div>

            <div>
              <label htmlFor="register-password" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Access Code
              </label>
              <input
                id="register-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                placeholder="Minimum 8 characters"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="register-confirm" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Confirm Access Code
              </label>
              <input
                id="register-confirm"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                placeholder="Re-enter access code"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Register Operator
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Access Terminal
            </Link>
          </p>
        </div>

        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>SYSTEM OPERATIONAL</span>
            <span className="text-gray-700">|</span>
            <span>v2.0.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
