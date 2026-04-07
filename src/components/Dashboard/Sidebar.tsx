import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
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
import { api } from '../../../convex/_generated/api'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'Overview' },
  { path: '/monitor', icon: Satellite, label: 'Monitor', section: 'Operations' },
  { path: '/timeline', icon: Clock, label: 'Timeline', section: 'Operations' },
  { path: '/analysis', icon: BarChart3, label: 'Analysis', section: 'Intelligence' },
  { path: '/settings', icon: Settings, label: 'Settings', section: 'System' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useQuery(api.auth.currentUser)
  const signOut = useMutation(api.auth.signOut)
  const { theme, toggleTheme } = useThemeStore()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut({})
    } catch {
      // ignore
    }
    navigate('/login')
  }

  return (
    <aside
      className={`relative flex flex-col bg-gray-950/80 backdrop-blur-xl border-r border-gray-800/50 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-7 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-400" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-400" />
        )}
      </button>

      <div className={`p-5 border-b border-gray-800/50 ${collapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-sm" />
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-black tracking-wider text-white">
                GOD <span className="text-blue-400">EYES</span>
              </h1>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.15em]">Satellite Intelligence</p>
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
                  <p className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em] px-3 pt-3 pb-1">
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
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent'
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

      <div className="p-3 border-t border-gray-800/50 space-y-1">
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`flex items-center gap-3 rounded-lg transition-all text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent ${
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
          }`}
          title={collapsed ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : undefined}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {!collapsed && <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {!collapsed && user && (
          <div className="px-3 py-3 bg-gray-900/50 rounded-lg border border-gray-800/50">
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
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${roleColors.operator}`}>
                <Shield className="w-2.5 h-2.5 inline mr-1" />
                operator
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          aria-label="Disconnect and log out"
          className={`flex items-center gap-3 rounded-lg transition-all text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent ${
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span className="text-sm font-medium">Disconnect</span>}
        </button>
      </div>
    </aside>
  )
}
