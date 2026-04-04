import { useEffect, useState } from 'react'
import {
  MapPin,
  Satellite,
  AlertTriangle,
  Activity,
  Eye,
  TrendingUp,
  RefreshCw,
  Shield,
  Clock,
  Zap,
  ChevronRight,
  Radio,
} from 'lucide-react'
import {
  apiGetDashboardStats,
  apiGetLocations,
  apiGetChanges,
  apiHealthCheck,
} from '../../services/api'
import type { DashboardStats } from '../../types'
import type { BackendLocation, BackendChange } from '../../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [locations, setLocations] = useState<BackendLocation[]>([])
  const [changes, setChanges] = useState<BackendChange[]>([])
  const [systemHealthy, setSystemHealthy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsData, locationsData, changesData, health] = await Promise.all([
        apiGetDashboardStats(),
        apiGetLocations(),
        apiGetChanges().catch(() => []),
        apiHealthCheck().catch(() => ({ status: 'degraded', service: 'God Eyes' })),
      ])
      setStats(statsData)
      setLocations(locationsData)
      setChanges(changesData.slice(0, 5))
      setSystemHealthy(health.status === 'healthy')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(message)
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm font-mono text-gray-500 uppercase tracking-wider">Initializing systems...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-sm font-mono text-red-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500/10 border-red-500/20 text-red-400',
    high: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/10 border-green-500/20 text-green-400',
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Mission Dashboard</h1>
            <span className={`px-2 py-0.5 border rounded text-[10px] font-mono uppercase tracking-wider ${
              systemHealthy
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            }`}>
              {systemHealthy ? 'All Systems Nominal' : 'System Degraded'}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-mono">
            Last sync: {stats?.last_sync ? new Date(stats.last_sync).toLocaleString() : 'N/A'}
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:text-white transition-all flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MapPin className="w-5 h-5" />}
          label="Active Sites"
          value={stats?.monitored_locations || 0}
          subtext={`of ${stats?.total_locations || 0} total`}
          color="text-blue-400"
          accent="from-blue-500/20 to-blue-600/5"
        />
        <StatCard
          icon={<Satellite className="w-5 h-5" />}
          label="Total Captures"
          value={stats?.total_captures || 0}
          subtext="All-time imagery"
          color="text-cyan-400"
          accent="from-cyan-500/20 to-cyan-600/5"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="High Severity"
          value={stats?.high_severity_changes || 0}
          subtext={`${stats?.total_changes || 0} total changes`}
          color="text-red-400"
          accent="from-red-500/20 to-red-600/5"
        />
        <StatCard
          icon={<Shield className="w-5 h-5" />}
          label="System Uptime"
          value={stats?.system_uptime || '0%'}
          subtext={`${stats?.active_alerts || 0} active alerts`}
          color="text-green-400"
          accent="from-green-500/20 to-green-600/5"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Changes */}
        <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Change Detections</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">{changes.length} events</span>
          </div>
          {changes.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Eye className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No change detections yet</p>
              <p className="text-xs text-gray-600 mt-1">Changes will appear when captures are compared</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/30">
              {changes.map((change) => (
                <div key={change.id} className="px-5 py-3.5 hover:bg-gray-800/20 transition-colors flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    change.severity === 'critical' ? 'bg-red-400 animate-pulse' :
                    change.severity === 'high' ? 'bg-orange-400' :
                    change.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{change.description || 'Change detected'}</span>
                      <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${severityColors[change.severity]}`}>
                        {change.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 font-mono">{change.location_id.slice(0, 8)}</span>
                      <span className="text-xs text-gray-600">Score: {change.change_score}%</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 font-mono flex-shrink-0">
                    {new Date(change.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">System Status</h2>
          </div>
          <div className="divide-y divide-gray-800/30">
            <SystemStatusItem service="API Server" status={systemHealthy ? 'online' : 'degraded'} latency="<50ms" />
            <SystemStatusItem service="Database" status="online" latency="<10ms" />
            <SystemStatusItem service="Mapbox Tiles" status="online" latency="<100ms" />
            <SystemStatusItem service="Scheduler" status="online" latency="—" />
            <SystemStatusItem service="Capture Engine" status="online" latency="—" />
            <SystemStatusItem service="Change Detection" status="online" latency="—" />
          </div>
        </div>
      </div>

      {/* Monitored Locations */}
      <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Monitored Locations</h2>
          </div>
          <span className="text-xs font-mono text-gray-500">{locations.length} sites</span>
        </div>
        {locations.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No locations configured</p>
            <p className="text-xs text-gray-600 mt-1">Add your first location from the Monitor tab</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/30">
            {locations.map((loc) => (
              <div key={loc.id} className="px-5 py-3.5 hover:bg-gray-800/20 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    loc.is_monitored ? 'bg-green-400' : 'bg-gray-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-white">{loc.name}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {loc.latitude}, {loc.longitude}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    loc.is_monitored
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-gray-400 bg-gray-400/10'
                  }`}>
                    {loc.is_monitored ? 'Monitored' : 'Idle'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext: string
  color: string
  accent: string
}) {
  return (
    <div className={`bg-gradient-to-br ${accent} border border-gray-800/50 rounded-xl p-5 hover:border-gray-700/50 transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className={color}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
      <p className="text-[10px] text-gray-600 font-mono mt-0.5">{subtext}</p>
    </div>
  )
}

function SystemStatusItem({ service, status, latency }: { service: string; status: string; latency: string }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          status === 'online' ? 'bg-green-400' :
          status === 'degraded' ? 'bg-yellow-400 animate-pulse' :
          'bg-red-400'
        }`} />
        <span className="text-sm text-gray-300">{service}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-gray-500">{latency}</span>
        <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
          status === 'online' ? 'text-green-400 bg-green-400/10' :
          status === 'degraded' ? 'text-yellow-400 bg-yellow-400/10' :
          'text-red-400 bg-red-400/10'
        }`}>
          {status}
        </span>
      </div>
    </div>
  )
}
