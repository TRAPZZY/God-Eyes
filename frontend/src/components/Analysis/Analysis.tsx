import { useEffect, useState } from 'react'
import { BarChart3, Satellite, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'
import { analysisAPI, locationAPI, monitoringAPI } from '../../services/api'
import type { Location, MonitoringSchedule } from '../../types'

interface AnalysisSummary {
  total_changes: number
  high_severity: number
  medium_severity: number
  low_severity: number
  recent_changes: Array<{
    id: string
    severity: string
    change_score: number
    description: string
    detected_at: string
  }>
}

export default function Analysis() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [summary, setSummary] = useState<AnalysisSummary | null>(null)
  const [sentinelDates, setSentinelDates] = useState<{ date: string; cloud_coverage: number }[]>([])
  const [schedules, setSchedules] = useState<MonitoringSchedule[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLocations()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      loadAnalysis(selectedLocation)
    }
  }, [selectedLocation])

  const loadLocations = async () => {
    try {
      const { data } = await locationAPI.list({ limit: 100 })
      setLocations(data)
      if (data.length > 0) setSelectedLocation(data[0].id)
    } catch {
      console.error('Failed to load locations')
    }
  }

  const loadAnalysis = async (locId: string) => {
    setLoading(true)
    try {
      const [summaryRes, datesRes, schedulesRes] = await Promise.all([
        analysisAPI.getSummary(locId),
        analysisAPI.getSentinelDates(locId, { max_cloud_coverage: 20 }),
        monitoringAPI.listSchedules(true),
      ])
      setSummary(summaryRes.data)
      setSentinelDates(datesRes.data.available_dates || [])
      setSchedules(schedulesRes.data.filter((s: MonitoringSchedule) => s.location_id === locId))
    } catch {
      console.error('Failed to load analysis data')
    } finally {
      setLoading(false)
    }
  }

  const handleSentinelCapture = async () => {
    if (!selectedLocation) return
    try {
      await analysisAPI.triggerSentinel(selectedLocation)
      loadAnalysis(selectedLocation)
    } catch {
      console.error('Sentinel capture failed')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analysis</h1>
        <p className="text-gray-400">AI-powered change detection and satellite intelligence</p>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-300">Location:</label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="px-4 py-2 bg-input border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSentinelCapture}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Satellite className="w-4 h-4" />
          Sentinel Capture
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold">{summary.total_changes}</p>
                  <p className="text-sm text-gray-400">Total Changes</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-red-500/30 p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-red-400">{summary.high_severity}</p>
                  <p className="text-sm text-gray-400">High Severity</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-yellow-500/30 p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{summary.medium_severity}</p>
                  <p className="text-sm text-gray-400">Medium Severity</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-green-500/30 p-6">
              <div className="flex items-center gap-3">
                <Satellite className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-green-400">{sentinelDates.length}</p>
                  <p className="text-sm text-gray-400">Available Dates</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Changes</h2>
              {summary.recent_changes.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No changes detected</p>
              ) : (
                <div className="space-y-3">
                  {summary.recent_changes.map((change) => (
                    <div
                      key={change.id}
                      className={`p-3 rounded-lg border ${
                        change.severity === 'high'
                          ? 'bg-red-500/10 border-red-500/30'
                          : change.severity === 'medium'
                          ? 'bg-yellow-500/10 border-yellow-500/30'
                          : 'bg-green-500/10 border-green-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Score: {change.change_score}%</p>
                          <p className="text-xs text-gray-400">{change.description}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(change.detected_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl border border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-4">Sentinel-2 Available Dates</h2>
              {sentinelDates.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No dates available. Configure Sentinel Hub credentials.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-auto">
                  {sentinelDates.slice(0, 20).map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-input rounded">
                      <span className="text-sm">{d.date.split('T')[0]}</span>
                      <span className="text-xs text-gray-400">Cloud: {d.cloud_coverage?.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {schedules.length > 0 && (
            <div className="bg-card rounded-xl border border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-4">Active Monitoring Schedules</h2>
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="p-3 bg-input rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{schedule.frequency} -- {schedule.capture_resolution}</p>
                        <p className="text-sm text-gray-400">
                          Next: {schedule.next_capture_at ? new Date(schedule.next_capture_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <span className="text-sm text-gray-400">{schedule.total_captures} captures</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-card rounded-xl border border-gray-700 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Select a location to view analysis data</p>
        </div>
      )}
    </div>
  )
}
