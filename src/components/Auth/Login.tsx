import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, Loader2, Shield, Zap, Globe, Crosshair } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api as convexApi } from '../../../convex/_generated/api'
const api = convexApi as any

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)
  const navigate = useNavigate()

  const signInWithPassword = useMutation(api.sessions.signIn)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithPassword({ email, password })
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-gray-950 to-gray-950 pointer-events-none" />
      
      <div className={`relative z-10 w-full max-w-md px-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Eye className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-wider text-white mb-2">
            GOD <span className="text-blue-400">EYES</span>
          </h1>
          <p className="text-sm font-medium tracking-widest text-blue-400/80 uppercase mb-3">
            Defense-Grade Satellite Intelligence Platform
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> CLASSIFIED</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> ACTIVE</span>
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> GLOBAL</span>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
            <Crosshair className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Authentication Required</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Operator Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm"
                placeholder="operator@godeyes.io"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Access Code
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm"
                placeholder="Enter access code"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Initialize Session
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-6">
            New operator?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Request Access
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
