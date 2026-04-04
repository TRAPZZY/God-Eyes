import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import Dashboard from './components/Dashboard/Dashboard'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Monitor from './components/Monitor/Monitor'
import Timeline from './components/Timeline/Timeline'
import Analysis from './components/Analysis/Analysis'
import Settings from './components/Settings/Settings'
import Sidebar from './components/Dashboard/Sidebar'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const loadUser = useAuthStore((s) => s.loadUser)
  const setTheme = useThemeStore((s) => s.setTheme)

  useEffect(() => {
    const saved = localStorage.getItem('godeyes-theme') as 'dark' | 'light' | null
    const theme = saved || 'dark'
    document.documentElement.setAttribute('data-theme', theme)
    setTheme(theme)
    loadUser()
  }, [setTheme, loadUser])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <Sidebar />
                <main className="flex-1 overflow-auto relative">
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="monitor" element={<Monitor />} />
                    <Route path="timeline" element={<Timeline />} />
                    <Route path="analysis" element={<Analysis />} />
                    <Route path="settings" element={<Settings />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
