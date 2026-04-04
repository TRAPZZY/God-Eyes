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
import { mockAPI } from '../../services/api'
import type { DashboardStats, ChangeDetection, Location, SystemStatus } from '../../types'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [changes, setChanges] = useState<ChangeDetection[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([])
  const [activity, setActivity] = useState<Array<{ id: string; type: string; message: string; timestamp: string; severity: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, locationsData, changesData, statusData, activityData] = await Promise.all([
        mockAPI.getDashboardStats(),
        mockAPI.getLocations(),
        mockAPI.getChanges(),
        mockAPI.getSystemStatus(),
        mockAPI.getRecentActivity(),
      ])
      setStats(statsData)
      setLocations(locationsData)
      setChanges(changesData.slice(0, 5))
      setSystemStatus(statusData)
      setActivity(activityData)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
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

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500/10 border-red-500/20 text-red-400',
    high: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/10 border-green-500/20 text-green-400',
  }

  const statusDotColors: Record<string, string> = {
    online: 'bg-green-400',
    degraded: 'bg-yellow-400',
    offline: 'bg-red-400',
  }

  const activityTypeIcons: Record<string, React.ReactNode> = {
    capture: <Satellite className="w-3.5 h-3.5" />,
    alert: <AlertTriangle className="w-3.5 h-3.5" />,
    change: <TrendingUp className="w-3.5 h-3.5" />,
    system: <Zap className="w-3.5 h-3.5" />,
  }

  const activitySeverityColors: Record<string, string> = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Mission Dashboard</h1>
            <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[10px] font-mono text-green-400 uppercase tracking-wider">
              All Systems Nominal
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
                    <span className="text-sm font-medium text-white truncate">{change.description}</span>
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${severityColors[change.severity]}`}>
                      {change.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 font-mono">{change.location_name}</span>
                    <span className="text-xs text-gray-600">Score: {change.score}%</span>
                    <span className="text-xs text-gray-600">{change.type}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-600 font-mono flex-shrink-0">
                  {new Date(change.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">System Status</h2>
          </div>
          <div className="divide-y divide-gray-800/30">
            {systemStatus.map((s) => (
              <div key={s.service} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${statusDotColors[s.status]} ${s.status === 'online' ? '' : 'animate-pulse'}`} />
                  <span className="text-sm text-gray-300">{s.service}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500">{s.latency}</span>
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    s.status === 'online' ? 'text-green-400 bg-green-400/10' :
                    s.status === 'degraded' ? 'text-yellow-400 bg-yellow-400/10' :
                    'text-red-400 bg-red-400/10'
                  }`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitored Locations */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Monitored Locations</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-800/30">
            {locations.map((loc) => (
              <div key={loc.id} className="px-5 py-3.5 hover:bg-gray-800/20 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    loc.status === 'active' ? 'bg-green-400' :
                    loc.status === 'alert' ? 'bg-red-400 animate-pulse' :
                    'bg-gray-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-white">{loc.name}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-mono">{loc.capture_count} captures</p>
                    <p className="text-xs text-gray-600 font-mono">
                      {new Date(loc.last_capture).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Activity Feed</h2>
          </div>
          <div className="divide-y divide-gray-800/30">
            {activity.map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-800/20 transition-colors">
                <div className={`mt-0.5 ${activitySeverityColors[item.severity] || 'text-gray-400'}`}>
                  {activityTypeIcons[item.type] || <Activity className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">{item.message}</p>
                  <p className="text-xs text-gray-600 font-mono mt-0.5">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                  item.severity === 'critical' ? 'text-red-400 bg-red-400/10' :
                  item.severity === 'high' ? 'text-orange-400 bg-orange-400/10' :
                  item.severity === 'warning' ? 'text-yellow-400 bg-yellow-400/10' :
                  'text-gray-400 bg-gray-400/10'
                }`}>
                  {item.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
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
