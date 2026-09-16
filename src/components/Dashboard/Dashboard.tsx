import { useState } from 'react'
import {
  MapPin,
  Satellite,
  AlertTriangle,
  Activity,
  Eye,
  Shield,
  ChevronRight,
  Radio,
  Download,
  Upload,
} from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api as convexApi } from '../../../convex/_generated/api'
const api = convexApi.api as any
import type { BackendLocation, BackendChange } from '../../convexref'
import { severityColors } from '../../constants/ui'
import { csvEscape, parseCsvRows } from '../../constants/csv'

export default function Dashboard() {
  const [importError, setImportError] = useState<string | null>(null)

  const stats = useQuery(api.stats.dashboard)
  const locations = useQuery(api.locations.list) as BackendLocation[] | undefined
  const changes = useQuery(api.changes.list) as BackendChange[] | undefined
  const health = useQuery(api.stats.health)

  const createLocation = useMutation(api.locationsMutations.create)

  const isLoading = stats === undefined || locations === undefined || changes === undefined || health === undefined

  if (isLoading) {
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

  const handleExportCSV = () => {
    if (!locations || locations.length === 0) return
    const headers = ['Name', 'Latitude', 'Longitude', 'Address', 'Monitored', 'Created']
    const rows = locations.map((loc: BackendLocation) => [
      csvEscape(loc.name),
      loc.latitude.toString(),
      loc.longitude.toString(),
      csvEscape(loc.address || ''),
      loc.is_monitored ? 'Yes' : 'No',
      new Date(loc.created_at).toLocaleDateString(),
    ])
    const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `godeyes_locations_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    if (file.size > 5 * 1024 * 1024) {
      setImportError('File too large. Maximum 5MB.')
      return
    }
    const text = await file.text()
    const rows = parseCsvRows(text)
    if (rows.length < 2) {
      setImportError('CSV must include a header row and at least one location.')
      return
    }
    const headers = rows[0]
    const nameIdx = headers.findIndex((h) => h.toLowerCase().includes('name'))
    const latIdx = headers.findIndex((h) => h.toLowerCase().includes('lat'))
    const lngIdx = headers.findIndex((h) => h.toLowerCase().includes('lng') || h.toLowerCase().includes('lon'))
    const addrIdx = headers.findIndex((h) => h.toLowerCase().includes('address'))
    if (nameIdx < 0 || latIdx < 0 || lngIdx < 0) {
      setImportError('CSV must include name, latitude, and longitude columns.')
      return
    }

    let imported = 0
    for (let i = 1; i < rows.length; i += 1) {
      const values = rows[i]
      const name = values[nameIdx]?.trim()
      const latitude = Number(values[latIdx])
      const longitude = Number(values[lngIdx])
      if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        continue
      }
      try {
        await createLocation({
          name,
          latitude,
          longitude,
          address: addrIdx >= 0 ? values[addrIdx] : undefined,
        })
        imported += 1
      } catch {
        console.error(`Failed to import row ${i}`)
      }
    }
    if (imported === 0) {
      setImportError('No valid locations were found in this CSV.')
      return
    }
    e.target.value = ''
  }

  const systemHealthy = health?.status === 'healthy'
  const recentChanges = (changes || []).slice(0, 5)
  const totalLocations = stats?.total_locations || 0
  const monitoredLocations = stats?.monitored_locations || 0
  const monitoringCoverage = totalLocations > 0
    ? `${Math.round((monitoredLocations / totalLocations) * 100)}%`
    : '0%'

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Workspace Dashboard</h1>
            <span className={`px-2 py-0.5 border rounded text-[10px] font-mono uppercase tracking-wider ${
              systemHealthy
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            }`}>
              {systemHealthy ? 'Data connected' : 'Connection issue'}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-mono">
            Last checked: {stats?.last_sync ? new Date(stats.last_sync).toLocaleString('en-US', { timeZone: 'UTC' }) : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!locations || locations.length === 0}
            aria-label="Export locations as CSV"
            className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:text-white transition-all flex items-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:text-white transition-all flex items-center gap-2 text-sm cursor-pointer">
            <Upload className="w-4 h-4" aria-hidden="true" />
            Import
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" aria-label="Import locations from CSV file" />
          </label>
        </div>
      </div>

      {importError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {importError}
        </div>
      )}

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
          label="Monitoring Coverage"
          value={monitoringCoverage}
          subtext={`${monitoredLocations} of ${totalLocations} active`}
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
            <span className="text-xs font-mono text-gray-500">{recentChanges.length} events</span>
          </div>
          {recentChanges.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Eye className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No change detections yet</p>
              <p className="text-xs text-gray-600 mt-1">Changes will appear when captures are compared</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/30">
              {recentChanges.map((change: BackendChange) => (
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
                      <span className="text-xs text-gray-500 font-mono">{String(change.location_id).slice(0, 8) || 'unknown'}</span>
                      <span className="text-xs text-gray-600">Score: {change.change_score}%</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 font-mono flex-shrink-0">
                    {new Date(change.detected_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
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
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Workspace Status</h2>
          </div>
          <div className="divide-y divide-gray-800/30">
            <SystemStatusItem label="Backend connection" status={systemHealthy ? 'connected' : 'checking'} detail={health?.service || 'Convex'} tone={systemHealthy ? 'ok' : 'warn'} />
            <SystemStatusItem label="Saved locations" status={`${totalLocations} total`} detail={`${monitoredLocations} monitored`} tone={totalLocations > 0 ? 'ok' : 'muted'} />
            <SystemStatusItem label="Imagery captures" status={`${stats?.total_captures || 0} stored`} detail="From active schedules" tone={(stats?.total_captures || 0) > 0 ? 'ok' : 'muted'} />
            <SystemStatusItem label="Alert rules" status={`${stats?.active_alerts || 0} active`} detail="User configured" tone={(stats?.active_alerts || 0) > 0 ? 'warn' : 'muted'} />
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
          <span className="text-xs font-mono text-gray-500">{locations?.length || 0} sites</span>
        </div>
        {!locations || locations.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No locations configured</p>
            <p className="text-xs text-gray-600 mt-1">Add your first location from the Monitor tab</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/30">
            {locations.map((loc: BackendLocation) => (
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

function SystemStatusItem({
  label,
  status,
  detail,
  tone,
}: {
  label: string
  status: string
  detail: string
  tone: 'ok' | 'warn' | 'muted'
}) {
  const toneClasses = {
    ok: {
      dot: 'bg-green-400',
      badge: 'text-green-400 bg-green-400/10',
    },
    warn: {
      dot: 'bg-yellow-400',
      badge: 'text-yellow-400 bg-yellow-400/10',
    },
    muted: {
      dot: 'bg-gray-500',
      badge: 'text-gray-400 bg-gray-400/10',
    },
  }[tone]

  return (
    <div className="px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${toneClasses.dot}`} />
        <div>
          <span className="text-sm text-gray-300">{label}</span>
          <p className="text-xs text-gray-600">{detail}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${toneClasses.badge}`}>
          {status}
        </span>
      </div>
    </div>
  )
}
