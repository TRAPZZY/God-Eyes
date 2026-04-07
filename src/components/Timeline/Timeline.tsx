import { useEffect, useState, useCallback } from 'react'
import {
  Clock,
  Satellite,
  Cloud,
  Eye,
  Filter,
  Calendar,
  MapPin,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { apiGetLocations, apiGetCaptures, apiGetLocationCaptures, type BackendLocation, type BackendCapture } from '../../services/api'

export default function Timeline() {
  const [locations, setLocations] = useState<BackendLocation[]>([])
  const [captures, setCaptures] = useState<BackendCapture[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const locs = await apiGetLocations()
      setLocations(locs)

      let caps: BackendCapture[] = []
      if (selectedLocation === 'all') {
        const result = await apiGetCaptures(1, 100)
        caps = result.captures
      } else {
        caps = await apiGetLocationCaptures(selectedLocation)
      }
      setCaptures(caps)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load timeline data'
      setError(message)
      console.error('Timeline load error:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedLocation])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [loadData])

  const sortedCaptures = [...captures].sort(
    (a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
  )

  const qualityBadge = (cloudCoverage: number | null) => {
    if (cloudCoverage == null) return { label: 'Unknown', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' }
    if (cloudCoverage <= 5) return { label: 'Excellent', color: 'text-green-400 bg-green-400/10 border-green-400/20' }
    if (cloudCoverage <= 15) return { label: 'Good', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' }
    if (cloudCoverage <= 30) return { label: 'Fair', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' }
    return { label: 'Poor', color: 'text-red-400 bg-red-400/10 border-red-400/20' }
  }

  const getLocationName = (locationId: string) => {
    const loc = locations.find((l) => l.id === locationId)
    return loc ? loc.name : locationId.slice(0, 8)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm font-mono text-gray-500 uppercase tracking-wider">Loading capture history...</p>
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

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Capture Timeline</h1>
            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] font-mono text-blue-400 uppercase tracking-wider">
              {sortedCaptures.length} captures
            </span>
          </div>
          <p className="text-sm text-gray-500 font-mono">Satellite imagery capture history</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Location:</span>
        </div>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono"
        >
          <option value="all">All Sites</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Capture Timeline */}
      <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Capture Log</h2>
          </div>
        </div>

        {sortedCaptures.length === 0 ? (
          <div className="p-12 text-center">
            <Satellite className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No captures found</p>
            <p className="text-xs text-gray-600 mt-1">Trigger a capture from the Monitor tab</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/30">
            {sortedCaptures.map((capture, index) => {
              const quality = qualityBadge(capture.cloud_coverage)
              return (
                <div
                  key={capture.id}
                  className="px-5 py-4 hover:bg-gray-800/20 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0 mt-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500/30 border border-blue-500/50" />
                      {index < sortedCaptures.length - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-8 bg-gray-800" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-sm font-medium text-white">{getLocationName(capture.location_id)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${quality.color}`}>
                            {quality.label}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">{capture.source}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-mono">
                            {new Date(capture.captured_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-mono">
                            {new Date(capture.captured_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {capture.cloud_coverage != null && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Cloud className="w-3.5 h-3.5" />
                            <span className="font-mono">{capture.cloud_coverage}% clouds</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="font-mono">{capture.resolution}</span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
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
