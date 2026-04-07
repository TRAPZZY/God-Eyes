import { useCallback, useMemo } from 'react'
import {
  BarChart3,
  Satellite,
  AlertTriangle,
  Brain,
  Target,
  Activity,
  Eye,
  MapPin,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { useQuery } from 'convex/react'
import { api as convexApi } from '../../../convex/_generated/api'
const api = convexApi as any
import type { BackendLocation, BackendChange, BackendSchedule } from '../../convexref'
import { severityColors } from '../../constants/ui'

export default function Analysis() {
  const locations = useQuery(api.locations.list) as BackendLocation[] | undefined
  const changes = useQuery(api.changes.list) as BackendChange[] | undefined
  const schedules = useQuery(api.schedules.list) as BackendSchedule[] | undefined

  const isLoading = locations === undefined || changes === undefined || schedules === undefined

  const getLocationName = useCallback((locationId: string) => {
    const loc = (locations as BackendLocation[] | undefined)?.find((l: BackendLocation) => l.id === locationId)
    return loc ? loc.name : locationId.slice(0, 8)
  }, [locations])

  const totalCaptures = useMemo(() => (schedules as BackendSchedule[] | undefined)?.reduce((sum: number, s: BackendSchedule) => sum + s.total_captures, 0) ?? 0, [schedules])
  const monitoredCount = useMemo(() => (locations as BackendLocation[] | undefined)?.filter((l: BackendLocation) => l.is_monitored).length ?? 0, [locations])
  const highSeverity = useMemo(() => (changes as BackendChange[] | undefined)?.filter((c: BackendChange) => c.severity === 'high' || c.severity === 'critical').length ?? 0, [changes])
  const severityData = useMemo(() => [
    { name: 'Critical', value: (changes as BackendChange[] | undefined)?.filter((c: BackendChange) => c.severity === 'critical').length ?? 0, color: '#ef4444' },
    { name: 'High', value: (changes as BackendChange[] | undefined)?.filter((c: BackendChange) => c.severity === 'high').length ?? 0, color: '#f97316' },
    { name: 'Medium', value: (changes as BackendChange[] | undefined)?.filter((c: BackendChange) => c.severity === 'medium').length ?? 0, color: '#eab308' },
    { name: 'Low', value: (changes as BackendChange[] | undefined)?.filter((c: BackendChange) => c.severity === 'low').length ?? 0, color: '#22c55e' },
  ], [changes])

  const changeTrendData = useMemo(() => computeChangeTrend(changes ?? []), [changes])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm font-mono text-gray-500 uppercase tracking-wider">Running AI analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Intelligence Analysis</h1>
            <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] font-mono text-purple-400 uppercase tracking-wider">
              AI Powered
            </span>
          </div>
          <p className="text-sm text-gray-500 font-mono">AI-powered change detection and land use classification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalysisCard
          icon={<MapPin className="w-5 h-5" />}
          label="Monitored Sites"
          value={monitoredCount.toString()}
          subtext={`of ${locations?.length ?? 0} total locations`}
          color="text-blue-400"
          accent="from-blue-500/20 to-blue-600/5"
        />
        <AnalysisCard
          icon={<Satellite className="w-5 h-5" />}
          label="Total Captures"
          value={totalCaptures.toString()}
          subtext={`${schedules?.length ?? 0} active schedules`}
          color="text-cyan-400"
          accent="from-cyan-500/20 to-cyan-600/5"
        />
        <AnalysisCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="High Severity"
          value={highSeverity.toString()}
          subtext={`${changes?.length ?? 0} total changes detected`}
          color="text-red-400"
          accent="from-red-500/20 to-red-600/5"
        />
        <AnalysisCard
          icon={<Brain className="w-5 h-5" />}
          label="Analysis Engine"
          value={(changes?.length ?? 0) > 0 ? 'Active' : 'Standby'}
          subtext="Change detection operational"
          color="text-purple-400"
          accent="from-purple-500/20 to-purple-600/5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Severity Distribution</h2>
          </div>
          <div className="p-5">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} fontFamily="'JetBrains Mono', monospace" />
                  <YAxis stroke="#4b5563" fontSize={10} fontFamily="'JetBrains Mono', monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Change Detection Trend</h2>
          </div>
          <div className="p-5">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={changeTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="month" stroke="#4b5563" fontSize={11} fontFamily="'JetBrains Mono', monospace" />
                  <YAxis stroke="#4b5563" fontSize={11} fontFamily="'JetBrains Mono', monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="changes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Detected Changes</h2>
          </div>
          <span className="text-xs font-mono text-gray-500">{changes?.length ?? 0} events</span>
        </div>
        {(!changes || changes.length === 0) ? (
          <div className="p-12 text-center">
            <Target className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No changes detected yet</p>
            <p className="text-xs text-gray-600 mt-1">Changes will appear after captures are compared</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/30">
            {(changes as BackendChange[]).map((change: BackendChange) => (
              <div key={change.id} className="px-5 py-3.5 hover:bg-gray-800/20 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    change.severity === 'critical' ? 'bg-red-400 animate-pulse' :
                    change.severity === 'high' ? 'bg-orange-400' :
                    change.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-white">{change.description || 'Change detected'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 font-mono">{getLocationName(change.location_id)}</span>
                      <span className="text-xs text-gray-600 font-mono">Score: {change.change_score}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${severityColors[change.severity]}`}>
                    {change.severity}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600">
                    {new Date(change.detected_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Monitoring Schedules</h2>
          </div>
          <span className="text-xs font-mono text-gray-500">{schedules?.length ?? 0} schedules</span>
        </div>
        {(!schedules || schedules.length === 0) ? (
          <div className="p-12 text-center">
            <Satellite className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No monitoring schedules configured</p>
            <p className="text-xs text-gray-600 mt-1">Create a schedule from the Monitor tab</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/30">
            {(schedules as BackendSchedule[]).map((schedule: BackendSchedule) => {
              const loc = (locations as BackendLocation[] | undefined)?.find((l: BackendLocation) => l.id === schedule.location_id)
              return (
                <div key={schedule.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${schedule.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{loc ? loc.name : schedule.location_id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500 font-mono capitalize">{schedule.frequency} - {schedule.capture_resolution}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 font-mono">{schedule.total_captures} captures</span>
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      schedule.is_active ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'
                    }`}>
                      {schedule.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function AnalysisCard({
  icon,
  label,
  value,
  subtext,
  color,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
  color: string
  accent: string
}) {
  return (
    <div className={`bg-gradient-to-br ${accent} border border-gray-800/50 rounded-xl p-5 hover:border-gray-700/50 transition-all`}>
      <div className={color}>{icon}</div>
      <p className="text-xl font-bold text-white mt-3">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
      <p className="text-[10px] text-gray-600 font-mono mt-0.5">{subtext}</p>
    </div>
  )
}

interface Change {
  detected_at: string
}

function computeChangeTrend(changes: Change[]) {
  const months: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    months[key] = 0
  }

  changes.forEach((c) => {
    const d = new Date(c.detected_at)
    const key = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    if (months[key] !== undefined) {
      months[key]++
    }
  })

  return Object.entries(months).map(([month, changes]) => ({ month, changes }))
}
