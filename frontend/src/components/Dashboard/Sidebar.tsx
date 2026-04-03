import { Link, useLocation } from 'react-router-dom'
import { Satellite, Radar, Clock, BarChart3, Settings, LogOut, Eye, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'

const navItems = [
  { path: '/', icon: Satellite, label: 'Dashboard' },
  { path: '/monitor', icon: Radar, label: 'Monitor' },
  { path: '/timeline', icon: Clock, label: 'Timeline' },
  { path: '/analysis', icon: BarChart3, label: 'Analysis' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggleTheme } = useThemeStore()

  return (
    <aside className="w-64 bg-card border-r border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Eye className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-primary">God Eyes</h1>
            <p className="text-xs text-gray-400">Satellite Intelligence</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-gray-300 hover:bg-input hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-input hover:text-white transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-danger/20 hover:text-danger transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
