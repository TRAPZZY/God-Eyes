import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { useThemeStore } from './store/themeStore'
import { ErrorBoundary } from './components/Shared/ErrorBoundary'
import { api as convexApi } from '../convex/_generated/api'
const api = convexApi as any
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Sidebar from './components/Dashboard/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'

const Monitor = lazy(() => import('./components/Monitor/Monitor'))
const Timeline = lazy(() => import('./components/Timeline/Timeline'))
const Analysis = lazy(() => import('./components/Analysis/Analysis'))
const Settings = lazy(() => import('./components/Settings/Settings'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
        </div>
        <p className="text-sm font-mono text-gray-500 uppercase tracking-wider">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.auth.currentUser)

  if (user === undefined) {
    return <PageLoader />
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  const setTheme = useThemeStore((s) => s.setTheme)

  useEffect(() => {
    const saved = localStorage.getItem('godeyes-theme') as 'dark' | 'light' | null
    const theme = saved || 'dark'
    document.documentElement.setAttribute('data-theme', theme)
    setTheme(theme)
  }, [setTheme])

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="monitor" element={<Monitor />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
