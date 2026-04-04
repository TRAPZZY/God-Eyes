import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Satellite,
  MapPin,
  Crosshair,
  Radio,
  Eye,
  AlertTriangle,
  ChevronRight,
  Search,
  Layers,
} from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import { mockAPI } from '../../services/api'
import type { Location as LocationType, MonitoringSchedule } from '../../types'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

export default function Monitor() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [locations, setLocations] = useState<LocationType[]>([])
  const [schedules, setSchedules] = useState<MonitoringSchedule[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (map.current && locations.length > 0) {
      updateMarkers()
    }
  }, [locations])

  useEffect(() => {
    if (map.current && selectedLocation) {
      const loc = locations.find((l) => l.id === selectedLocation)
      if (loc) {
        map.current.flyTo({
          center: [loc.longitude, loc.latitude],
          zoom: 12,
          duration: 1500,
          essential: true,
        })
      }
    }
  }, [selectedLocation, locations])

  const loadData = async () => {
    try {
      const [locsData, schedData] = await Promise.all([
        mockAPI.getLocations(),
        mockAPI.getSchedules(),
      ])
      setLocations(locsData)
      setSchedules(schedData)
    } catch (err) {
      console.error('Failed to load monitor data:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateMarkers = useCallback(() => {
    if (!map.current) return

    locations.forEach((loc) => {
      const el = document.createElement('div')
      el.className = 'custom-marker'
      const isSelected = loc.id === selectedLocation
      const statusColor = loc.status === 'active' ? '#10b981' : loc.status === 'alert' ? '#ef4444' : '#6b7280'

      el.innerHTML = `
        <div style="
          width: ${isSelected ? '24px' : '16px'};
          height: ${isSelected ? '24px' : '16px'};
          background: ${statusColor};
          border: 2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.3)'};
          border-radius: 50%;
          box-shadow: 0 0 ${isSelected ? '20px' : '10px'} ${statusColor}40;
          cursor: pointer;
          transition: all 0.3s ease;
        "></div>
      `

      el.addEventListener('click', () => {
        setSelectedLocation(loc.id)
      })

      new mapboxgl.Marker(el)
        .setLngLat([loc.longitude, loc.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, className: 'custom-popup' }).setHTML(`
            <div style="font-family: 'Inter', sans-serif; padding: 4px;">
              <p style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #f1f5f9;">${loc.name}</p>
              <p style="font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace;">${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}</p>
              <p style="font-size: 11px; color: #64748b; margin-top: 2px;">${loc.capture_count} captures</p>
            </div>
          `)
        )
        .addTo(map.current!)
    })
  }, [locations, selectedLocation])

  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-95.7129, 37.0902],
      zoom: 3,
      attributionControl: false,
    })

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right')

    map.current.on('load', () => {
      if (locations.length > 0) {
        updateMarkers()
      }
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedLocData = locations.find((l) => l.id === selectedLocation)
  const selectedSchedule = schedules.find((s) => s.location_id === selectedLocation)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm font-mono text-gray-500 uppercase tracking-wider">Loading satellite feeds...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Location List */}
      <div className="w-80 bg-gray-950/80 backdrop-blur-sm border-r border-gray-800/50 flex flex-col">
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Surveillance Sites</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sites..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredLocations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-800/30 hover:bg-gray-800/30 transition-colors ${
                selectedLocation === loc.id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    loc.status === 'active' ? 'bg-green-400' :
                    loc.status === 'alert' ? 'bg-red-400 animate-pulse' :
                    'bg-gray-500'
                  }`} />
                  <span className="text-sm font-medium text-white">{loc.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex items-center gap-3 mt-1 ml-4">
                <span className="text-xs text-gray-500 font-mono">{loc.address}</span>
                <span className="text-xs text-gray-600 font-mono">{loc.capture_count} captures</span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Location Detail */}
        {selectedLocData && (
          <div className="p-4 border-t border-gray-800/50 bg-gray-900/30">
            <div className="flex items-center gap-2 mb-3">
              <Crosshair className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Target Details</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Coordinates</span>
                <span className="text-xs font-mono text-gray-300">
                  {selectedLocData.latitude.toFixed(4)}, {selectedLocData.longitude.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <span className={`text-xs font-mono uppercase ${
                  selectedLocData.status === 'active' ? 'text-green-400' :
                  selectedLocData.status === 'alert' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {selectedLocData.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Captures</span>
                <span className="text-xs font-mono text-gray-300">{selectedLocData.capture_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Last Capture</span>
                <span className="text-xs font-mono text-gray-300">
                  {new Date(selectedLocData.last_capture).toLocaleDateString()}
                </span>
              </div>
              {selectedSchedule && (
                <>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Schedule</span>
                    <span className="text-xs font-mono text-blue-400 capitalize">{selectedSchedule.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Monitoring</span>
                    <span className={`text-xs font-mono uppercase ${selectedSchedule.is_active ? 'text-green-400' : 'text-gray-400'}`}>
                      {selectedSchedule.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Map Overlay Controls */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono text-gray-300">Dark Satellite</span>
          </div>
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2 flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-400" />
            <span className="text-xs font-mono text-gray-300">{locations.filter(l => l.is_monitored).length} Active</span>
          </div>
          {locations.some(l => l.status === 'alert') && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-mono text-red-400">Alert</span>
            </div>
          )}
        </div>

        {/* Coordinates Display */}
        <div className="absolute bottom-4 left-4 z-10 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2">
          <span className="text-xs font-mono text-gray-400">
            {selectedLocData
              ? `${selectedLocData.latitude.toFixed(6)}°N ${Math.abs(selectedLocData.longitude).toFixed(6)}°W`
              : 'SELECT A TARGET'}
          </span>
        </div>
      </div>
    </div>
  )
}
