import { useEffect, useState } from 'react'
import { Satellite, MapPin, AlertTriangle, Activity, Eye, Film, FileText, BarChart3, TrendingUp, Settings } from 'lucide-react'
import { analysisAPI, locationAPI, heatmapAPI } from '../../services/api'
import type { DashboardStats, Location } from '../../types'

interface WidgetConfig {
  id: string
  type: 'stats' | 'locations' | 'status' | 'heatmap' | 'activity'
  enabled: boolean
  title: string
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stats', type: 'stats', enabled: true, title: 'Key Metrics' },
  { id: 'locations', type: 'locations', enabled: true, title: 'Recent Locations' },
  { id: 'status', type: 'status', enabled: true, title: 'System Status' },
  { id: 'activity', type: 'activity', enabled: true, title: 'Recent Activity' },
  { id: 'heatmap', type: 'heatmap', enabled: false, title: 'Change Heatmap' },
]

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS)
  const [showWidgetSettings, setShowWidgetSettings] = useState(false)
  const [heatmapData, setHeatmapData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, locRes] = await Promise.all([
        analysisAPI.getDashboardStats(),
        locationAPI.list({ limit: 10 }),
      ])
      setStats(statsRes.data)
      setLocations(locRes.data)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleWidget = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    )
  }

  const isWidgetEnabled = (id: string) => widgets.find((w) => w.id === id)?.enabled ?? true

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400">Satellite intelligence overview</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWidgetSettings(!showWidgetSettings)}
            className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Widgets
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <Satellite className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {showWidgetSettings && (
        <div className="bg-card rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Customize Widgets</h3>
          <div className="flex flex-wrap gap-3">
            {widgets.map((widget) => (
              <label
                key={widget.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  widget.enabled
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={widget.enabled}
                  onChange={() => toggleWidget(widget.id)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  widget.enabled ? 'bg-primary border-primary' : 'border-gray-600'
                }`}>
                  {widget.enabled && <span className="text-white text-xs">+</span>}
                </div>
                <span className="text-sm">{widget.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {isWidgetEnabled('stats') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<MapPin className="w-6 h-6" />}
            label="Total Locations"
            value={stats?.total_locations || 0}
            color="text-blue-400"
          />
          <StatCard
            icon={<Eye className="w-6 h-6" />}
            label="Monitored"
            value={stats?.monitored_locations || 0}
            color="text-green-400"
          />
          <StatCard
            icon={<Satellite className="w-6 h-6" />}
            label="Total Captures"
            value={stats?.total_captures || 0}
            color="text-purple-400"
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="High Severity Changes"
            value={stats?.high_severity_changes || 0}
            color="text-red-400"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isWidgetEnabled('locations') && (
          <div className="bg-card rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Recent Locations
            </h2>
            {locations.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No locations added yet</p>
            ) : (
              <div className="space-y-3">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between p-3 bg-input rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{loc.name}</p>
                      <p className="text-sm text-gray-400">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        loc.is_monitored
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {loc.is_monitored ? 'Monitoring' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isWidgetEnabled('status') && (
          <div className="bg-card rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-warning" />
              System Status
            </h2>
            <div className="space-y-4">
              <StatusItem label="API Connection" status="online" />
              <StatusItem label="Database" status="online" />
              <StatusItem label="Mapbox Service" status="online" />
              <StatusItem label="Sentinel Hub" status={stats ? 'online' : 'pending'} />
              <StatusItem label="Celery Workers" status="pending" />
            </div>
          </div>
        )}

        {isWidgetEnabled('activity') && (
          <div className="bg-card rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction
                icon={<Film className="w-5 h-5" />}
                label="Time-lapse"
                description="Generate from captures"
                color="text-purple-400"
              />
              <QuickAction
                icon={<FileText className="w-5 h-5" />}
                label="Report"
                description="Export intelligence"
                color="text-blue-400"
              />
              <QuickAction
                icon={<BarChart3 className="w-5 h-5" />}
                label="Analytics"
                description="View trends"
                color="text-green-400"
              />
              <QuickAction
                icon={<AlertTriangle className="w-5 h-5" />}
                label="Alerts"
                description="Manage rules"
                color="text-yellow-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className={color}>{icon}</div>
      </div>
      <p className="text-3xl font-bold mt-4">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  )
}

function StatusItem({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-300">{label}</span>
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          status === 'online'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-yellow-500/20 text-yellow-400'
        }`}
      >
        {status}
      </span>
    </div>
  )
}

function QuickAction({ icon, label, description, color }: { icon: React.ReactNode; label: string; description: string; color: string }) {
  return (
    <button className="flex flex-col items-center gap-2 p-4 bg-input rounded-lg hover:bg-gray-700 transition-colors text-left">
      <div className={color}>{icon}</div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </button>
  )
}
