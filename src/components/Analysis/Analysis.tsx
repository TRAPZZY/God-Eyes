import { useEffect, useState } from 'react'
import {
  BarChart3,
  Satellite,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Brain,
  Target,
  Leaf,
  Droplets,
  Building2,
  Mountain,
  Activity,
  MapPin,
  Eye,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { mockAPI } from '../../services/api'
import type { AnalysisResult, ChangeDetection, SentinelDate, MonitoringSchedule } from '../../types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

export default function Analysis() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [changes, setChanges] = useState<ChangeDetection[]>([])
  const [sentinelDates, setSentinelDates] = useState<SentinelDate[]>([])
  const [schedules, setSchedules] = useState<MonitoringSchedule[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [analysisData, changesData, sentinelData, schedulesData] = await Promise.all([
        mockAPI.getAnalysis(),
        mockAPI.getChanges(),
        mockAPI.getSentinelDates(),
        mockAPI.getSchedules(),
      ])
      setAnalysis(analysisData)
      setChanges(changesData)
      setSentinelDates(sentinelData)
      setSchedules(schedulesData)
    } catch (err) {
      console.error('Failed to load analysis data:', err)
    } finally {
      setLoading(false)
    }
  }

  const landUseData = analysis
    ? Object.entries(analysis.land_use).map(([key, value]) => ({
        name: key.replace('_', ' ').toUpperCase(),
        value,
      }))
    : []

  const changeTrendData = [
    { month: 'Nov', changes: 12 },
    { month: 'Dec', changes: 18 },
    { month: 'Jan', changes: 24 },
    { month: 'Feb', changes: 15 },
    { month: 'Mar', changes: 32 },
    { month: 'Apr', changes: 28 },
  ]

  const severityData = [
    { name: 'Critical', value: changes.filter((c) => c.severity === 'critical').length, color: '#ef4444' },
    { name: 'High', value: changes.filter((c) => c.severity === 'high').length, color: '#f97316' },
    { name: 'Medium', value: changes.filter((c) => c.severity === 'medium').length, color: '#eab308' },
    { name: 'Low', value: changes.filter((c) => c.severity === 'low').length, color: '#22c55e' },
  ]

  const landUseColors = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#06b6d4', '#6b7280']

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500/10 border-red-500/20 text-red-400',
    high: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/10 border-green-500/20 text-green-400',
  }

  if (loading && !analysis) {
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
    <div
      className={`p-6 space-y-6 max-w-[1600px] mx-auto transition-all duration-500 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Header */}
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
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:text-white transition-all flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* AI Analysis Summary Cards */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <AnalysisCard
            icon={<Brain className="w-5 h-5" />}
            label="AI Confidence"
            value={`${analysis.confidence}%`}
            subtext="Classification accuracy"
            color="text-purple-400"
            accent="from-purple-500/20 to-purple-600/5"
          />
          <AnalysisCard
            icon={<Leaf className="w-5 h-5" />}
            label="Vegetation Index"
            value={analysis.vegetation_index.toFixed(2)}
            subtext="NDVI measurement"
            color="text-green-400"
            accent="from-green-500/20 to-green-600/5"
          />
          <AnalysisCard
            icon={<Building2 className="w-5 h-5" />}
            label="Urban Density"
            value={`${(analysis.urban_density * 100).toFixed(0)}%`}
            subtext="Built-up area ratio"
            color="text-blue-400"
            accent="from-blue-500/20 to-blue-600/5"
          />
          <AnalysisCard
            icon={<Droplets className="w-5 h-5" />}
            label="Water Coverage"
            value={`${analysis.water_coverage}%`}
            subtext="Surface water detection"
            color="text-cyan-400"
            accent="from-cyan-500/20 to-cyan-600/5"
          />
          <AnalysisCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Change Trend"
            value={analysis.change_trend.toUpperCase()}
            subtext="30-day trajectory"
            color={analysis.change_trend === 'increasing' ? 'text-orange-400' : 'text-green-400'}
            accent={analysis.change_trend === 'increasing' ? 'from-orange-500/20 to-orange-600/5' : 'from-green-500/20 to-green-600/5'}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Land Use Distribution */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Land Use Classification</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={landUseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {landUseData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={landUseColors[index % landUseColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #1f2937',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Coverage']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {landUseData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: landUseColors[i % landUseColors.length] }}
                      />
                      <span className="text-sm text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-mono text-gray-400">{item.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Change Trend */}
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

      {/* Severity Distribution + Recent Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
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

        {/* Recent Changes */}
        <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Detected Changes</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">{changes.length} events</span>
          </div>
          <div className="divide-y divide-gray-800/30">
            {changes.map((change) => (
              <div key={change.id} className="px-5 py-3.5 hover:bg-gray-800/20 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    change.severity === 'critical' ? 'bg-red-400 animate-pulse' :
                    change.severity === 'high' ? 'bg-orange-400' :
                    change.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-white">{change.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 font-mono">{change.location_name}</span>
                      <span className="text-xs text-gray-600 font-mono">Score: {change.score}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${severityColors[change.severity]}`}>
                    {change.severity}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600">
                    {new Date(change.detected_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sentinel-2 Archive */}
      <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Sentinel-2 Archive</h2>
          </div>
          <span className="text-xs font-mono text-gray-500">{sentinelDates.length} dates available</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2 p-5">
          {sentinelDates.slice(0, 10).map((date, i) => {
            const qualityColor =
              date.quality === 'high'
                ? 'border-green-500/30 bg-green-500/5'
                : date.quality === 'medium'
                ? 'border-yellow-500/30 bg-yellow-500/5'
                : 'border-red-500/30 bg-red-500/5'

            const dotColor =
              date.quality === 'high' ? 'bg-green-400' : date.quality === 'medium' ? 'bg-yellow-400' : 'bg-red-400'

            return (
              <div
                key={i}
                className={`p-2.5 rounded-lg border ${qualityColor} hover:border-gray-600/50 transition-colors cursor-pointer text-center`}
              >
                <div className={`w-2 h-2 rounded-full ${dotColor} mx-auto mb-1.5`} />
                <p className="text-[10px] font-mono text-gray-300">
                  {new Date(date.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{date.cloud_coverage}%</p>
              </div>
            )
          })}
        </div>
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
