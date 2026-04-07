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
  Settings as SettingsIcon,
} from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convexref'

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const user = useQuery(api.auth.currentUser as any)
  const health = useQuery(api.stats.health as any)
  const signOut = useMutation(api.auth.signOut as any)

  useEffect(() => {
    const interval = setInterval(() => {}, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut({})
    } catch {
      // continue anyway
    }
    window.location.href = '/login'
  }

  const roleColors: Record<string, string> = {
    superadmin: 'text-red-400 bg-red-400/10 border-red-400/20',
    admin: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    analyst: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    operator: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  }

  if (user === undefined) {
    return (
      <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
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
                  {user?.username?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{user?.full_name || user?.username || 'Unknown'}</p>
                <p className="text-sm text-gray-500 font-mono">{user?.email || 'No email'}</p>
                <span className={`inline-block mt-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${roleColors[user?.role || 'operator']}`}>
                  {user?.role || 'operator'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Operator ID</span>
                <span className="text-xs text-gray-300 font-mono">{user?.id ? String(user.id).slice(0, 8) : '—'}...</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Email</span>
                <span className="text-xs text-gray-300 font-mono">{user?.email || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Callsign</span>
                <span className="text-xs text-gray-300 font-mono">{user?.username || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Clearance</span>
                <span className={`text-xs font-mono uppercase ${roleColors[user?.role || 'operator']?.split(' ')[0]}`}>
                  {user?.role || 'operator'}
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
          <div className="p-5 space-y-4">
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
              <label htmlFor="settings-current-password" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Current Access Code
              </label>
              <div className="relative">
                <input
                  id="settings-current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                  placeholder="Enter current code"
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
              <label htmlFor="settings-new-password" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                New Access Code
              </label>
              <div className="relative">
                <input
                  id="settings-new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                  placeholder="Minimum 8 characters"
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
              <label htmlFor="settings-confirm-password" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Confirm New Access Code
              </label>
              <div className="relative">
                <input
                  id="settings-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                  placeholder="Re-enter new code"
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

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs">
              Password changes via Convex Auth require additional setup. Use your GitHub OAuth for now.
            </div>
          </div>
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
                  health?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400 animate-pulse'
                }`} />
                <div>
                  <p className="text-sm text-white">Backend API</p>
                  <p className="text-xs text-gray-500 font-mono">Convex Managed</p>
                </div>
              </div>
              <RefreshCw className={`w-4 h-4 text-gray-500`} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Status</span>
                <span className={`text-xs font-mono uppercase ${
                  health?.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {health?.status || 'Checking...'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Service</span>
                <span className="text-xs text-gray-300 font-mono">{health?.service || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/30">
                <span className="text-xs text-gray-500 font-mono uppercase">Backend</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300 font-mono">Convex Cloud</span>
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
                <p className="text-xs text-gray-500 font-mono">Convex PostgreSQL</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-white">Authentication</p>
                <p className="text-xs text-gray-500 font-mono">Convex Auth + GitHub OAuth</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
              <Shield className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-white">Map Provider</p>
                <p className="text-xs text-gray-500 font-mono">Mapbox GL JS + Sentinel-2</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
              <Globe className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-sm text-white">Version</p>
                <p className="text-xs text-gray-500 font-mono">v2.0.0</p>
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
            onClick={handleSignOut}
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
