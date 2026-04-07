import { useState, useEffect } from 'react'
import {
  User,
  Shield,
  Key,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Server,
  Globe,
  Database,
  Clock,
  RefreshCw,
  Copy,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import {
  apiHealthCheck,
  apiLogout,
} from '../../services/api'
import { roleColors } from '../../constants/ui'

export default function Settings() {
  const { user, logout } = useAuthStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [healthStatus, setHealthStatus] = useState<{ status: string; service: string } | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [apiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = async () => {
    setHealthLoading(true)
    try {
      const data = await apiHealthCheck()
      setHealthStatus(data)
    } catch {
      setHealthStatus({ status: 'unreachable', service: 'God Eyes' })
    } finally {
      setHealthLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    setPasswordLoading(true)
    try {
      const token = localStorage.getItem('godeyes_access_token')
      const res = await fetch(`${apiUrl.replace('/api/v1', '')}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const err = await res.json().catch(() => ({ detail: 'Failed to change password' }))
        setPasswordMsg({ type: 'error', text: err.detail || 'Failed to change password' })
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Network error. Check backend connection.' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const copyApiUrl = () => {
    navigator.clipboard.writeText(apiUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <SettingsIcon className="w-6 h-6 text-gray-400" />
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
        </div>
        <p className="text-sm text-gray-500 font-mono">Manage your account, security, and system configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Operator Profile</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-400">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{user?.full_name || user?.username}</p>
                <p className="text-sm text-gray-500 font-mono">{user?.email}</p>
                <span className={`inline-block mt-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${roleColors[user?.role || 'operator']}`}>
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Operator ID</span>
                <span className="text-xs text-gray-300 font-mono">{user?.id?.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Email</span>
                <span className="text-xs text-gray-300 font-mono">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Callsign</span>
                <span className="text-xs text-gray-300 font-mono">{user?.username}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Clearance</span>
                <span className={`text-xs font-mono uppercase ${roleColors[user?.role || 'operator']?.split(' ')[0]}`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center gap-2">
            <Key className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Change Access Code</h2>
          </div>
          <form onSubmit={handleChangePassword} className="p-5 space-y-4">
            {passwordMsg && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {passwordMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                )}
                {passwordMsg.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Current Access Code
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                  placeholder="Enter current code"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                New Access Code
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                  placeholder="Minimum 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Confirm New Access Code
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                  placeholder="Re-enter new code"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Update Access Code
                </>
              )}
            </button>
          </form>
        </div>

        {/* System Connection */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center gap-2">
            <Server className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">System Connection</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  healthStatus?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400 animate-pulse'
                }`} />
                <div>
                  <p className="text-sm text-white">Backend API</p>
                  <p className="text-xs text-gray-500 font-mono truncate max-w-[250px]">{apiUrl}</p>
                </div>
              </div>
              <button
                onClick={checkHealth}
                disabled={healthLoading}
                aria-label="Refresh health status"
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Status</span>
                <span className={`text-xs font-mono uppercase ${
                  healthStatus?.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {healthStatus?.status || 'Checking...'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Service</span>
                <span className="text-xs text-gray-300 font-mono">{healthStatus?.service || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">API Endpoint</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300 font-mono">{apiUrl}</span>
                  <button onClick={copyApiUrl} aria-label={copied ? 'API URL copied' : 'Copy API URL'} className="text-gray-500 hover:text-white transition-colors">
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">System Information</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
              <Database className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-white">Database</p>
                <p className="text-xs text-gray-500 font-mono">SQLite (local) / PostgreSQL (production)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-white">Scheduler</p>
                <p className="text-xs text-gray-500 font-mono">Thread-based capture scheduler</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
              <Shield className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-white">Authentication</p>
                <p className="text-xs text-gray-500 font-mono">JWT Bearer tokens (HS256)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
              <Globe className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-sm text-white">Map Provider</p>
                <p className="text-xs text-gray-500 font-mono">Mapbox GL JS + Sentinel-2</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-gray-900/40 backdrop-blur-sm border border-red-500/20 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-red-500/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">Danger Zone</h2>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Terminate Session</p>
            <p className="text-xs text-gray-500 mt-1">Log out and clear all authentication tokens</p>
          </div>
          <button
            onClick={() => { apiLogout(); logout(); }}
            aria-label="Terminate session and disconnect"
            className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm font-mono uppercase"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </div>
    </div>
  )
}
