import { useEffect, useState } from 'react'
import { Clock, Activity, AlertTriangle, CheckCircle, Play, Pause, RefreshCw } from 'lucide-react'
import { monitoringAPI, analysisAPI } from '../../services/api'
import type { MonitoringSchedule } from '../../types'

export default function Monitor() {
  const [schedules, setSchedules] = useState<MonitoringSchedule[]>([])
  const [schedulerStats, setSchedulerStats] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMonitoringStatus()
  }, [])

  const loadMonitoringStatus = async () => {
    try {
      const { data } = await analysisAPI.getMonitoringStatus()
      setSchedules(data.schedules || [])
      setSchedulerStats(data.scheduler || {})
    } catch {
      console.error('Failed to load monitoring status')
    } finally {
      setLoading(false)
    }
  }

  const toggleSchedule = async (scheduleId: string, currentActive: boolean) => {
    try {
      await monitoringAPI.updateSchedule(scheduleId, { is_active: !currentActive })
      loadMonitoringStatus()
    } catch {
      console.error('Failed to toggle schedule')
    }
  }

  const triggerCapture = async (scheduleId: string) => {
    try {
      await monitoringAPI.triggerCapture(scheduleId)
      loadMonitoringStatus()
    } catch {
      console.error('Failed to trigger capture')
    }
  }

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
          <h1 className="text-2xl font-bold">Monitor</h1>
          <p className="text-gray-400">Scheduled captures and monitoring status</p>
        </div>
        <button
          onClick={loadMonitoringStatus}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="Scheduler Runs"
          value={schedulerStats.total_runs as number || 0}
          color="text-blue-400"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Captures Made"
          value={schedulerStats.total_captures as number || 0}
          color="text-green-400"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="Errors"
          value={schedulerStats.total_errors as number || 0}
          color="text-red-400"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Active Schedules"
          value={schedules.filter(s => s.is_active).length}
          color="text-purple-400"
        />
      </div>

      <div className="bg-card rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Monitoring Schedules</h2>
        {schedules.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No monitoring schedules configured. Create one from the Analysis panel.</p>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between p-4 bg-input rounded-lg border border-gray-600">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{schedule.location_name || 'Unknown Location'}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      schedule.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {schedule.is_active ? 'Active' : 'Paused'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-primary/20 text-primary capitalize">
                      {schedule.frequency}
                    </span>
                  </div>
                  <div className="flex gap-6 mt-2 text-sm text-gray-400">
                    <span>Next: {schedule.next_capture_at ? new Date(schedule.next_capture_at).toLocaleString() : 'N/A'}</span>
                    <span>Last: {schedule.last_capture_at ? new Date(schedule.last_capture_at).toLocaleString() : 'Never'}</span>
                    <span>Total: {schedule.total_captures} captures</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => triggerCapture(schedule.id)}
                    className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 flex items-center gap-1 text-sm"
                  >
                    <Play className="w-3 h-3" />
                    Capture
                  </button>
                  <button
                    onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                    className={`px-3 py-1.5 rounded flex items-center gap-1 text-sm ${
                      schedule.is_active
                        ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                        : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    }`}
                  >
                    {schedule.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {schedule.is_active ? 'Pause' : 'Resume'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-gray-700 p-6">
      <div className={color}>{icon}</div>
      <p className="text-3xl font-bold mt-4">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  )
}
