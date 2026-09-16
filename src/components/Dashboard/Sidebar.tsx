import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import {
  LayoutDashboard,
  Satellite,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Eye,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
} from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { roleColors } from '../../constants/ui'
import { api as convexApi } from '../../../convex/_generated/api'
const api = convexApi.api as any

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview', section: 'Workspace' },
  { path: '/monitor', icon: Satellite, label: 'Locations', section: 'Operations' },
  { path: '/timeline', icon: Clock, label: 'Activity', section: 'Operations' },
  { path: '/analysis', icon: BarChart3, label: 'Insights', section: 'Review' },
  { path: '/settings', icon: Settings, label: 'Settings', section: 'Account' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useQuery(api.sessions.currentUser)
  const { signOut } = useAuthActions()
  const { theme, toggleTheme } = useThemeStore()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
    } catch {
      // ignore
    }
    navigate('/login')
  }

  return (
    <aside
      className={`relative flex flex-col border-r border-white/[0.06] bg-slate-950/90 shadow-2xl shadow-black/20 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-7 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-900 transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-400" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-400" />
        )}
      </button>

      <div className={`border-b border-white/[0.06] p-5 ${collapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-sm" />
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-semibold tracking-tight text-white">
                God <span className="text-blue-300">Eyes</span>
              </h1>
              <p className="text-xs text-slate-500">Operations workspace</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          const isActive = location.pathname === item.path
          return (
            <div key={item.path}>
              {i === 0 || navItems[i - 1].section !== item.section ? (
                !collapsed && (
                  <p className="px-3 pb-1 pt-3 text-[11px] font-medium text-slate-600">
                    {item.section}
                  </p>
                )
              ) : null}
              <Link
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg transition-all group ${
                  collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-300 border border-blue-400/20 shadow-sm shadow-blue-950/30'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {!collapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </Link>
            </div>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-white/[0.06] p-3">
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`flex items-center gap-3 rounded-lg border border-transparent text-slate-400 transition-all hover:bg-white/[0.04] hover:text-slate-100 ${
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
          }`}
          title={collapsed ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : undefined}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {!collapsed && <span className="text-sm font-medium">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        {!collapsed && user && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.full_name || user.username}</p>
                <p className="text-xs text-gray-500 font-mono truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${roleColors.operator}`}>
                <Shield className="w-2.5 h-2.5 inline mr-1" />
                Team member
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          aria-label="Sign out"
          className={`flex items-center gap-3 rounded-lg border border-transparent text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-300 ${
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
