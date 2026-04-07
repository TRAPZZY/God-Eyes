import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Satellite,
  MapPin,
  Crosshair,
  Radio,
  Eye,
  AlertTriangle,
  Search,
  Layers,
  Plus,
  Loader2,
  X,
} from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import { useQuery, useMutation } from 'convex/react'
import { api as convexApi } from '../../../convex/_generated/api'
const api = convexApi as any
import type { BackendLocation, BackendSchedule } from '../../convexref'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

export default function Monitor() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [capturing, setCapturing] = useState<string | null>(null)
  const [newLocation, setNewLocation] = useState({ name: '', latitude: '', longitude: '', address: '' })

  const locations = useQuery(api.locations.list) as BackendLocation[] | undefined
  const schedules = useQuery(api.schedules.list) as BackendSchedule[] | undefined
  const createLocation = useMutation(api.locationsMutations.create)
  const createCapture = useMutation(api.capturesMutations.create)

  const isLoading = locations === undefined || schedules === undefined

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m: mapboxgl.Marker) => m.remove())
    markersRef.current = []
  }, [])

  const updateMarkers = useCallback(() => {
    if (!map.current || !locations) return
    clearMarkers()

    locations.forEach((loc: BackendLocation) => {
      const el = document.createElement('div')
      const isSelected = loc.id === selectedLocation
      const statusColor = loc.is_monitored ? '#10b981' : '#6b7280'

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

      const marker = new mapboxgl.Marker(el)
        .setLngLat([loc.longitude, loc.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: 'Inter', sans-serif; padding: 4px; color: #f1f5f9; background: #0f172a; border-radius: 6px;">
              <p style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${loc.name}</p>
              <p style="font-size: 11px; color: #94a3b8; font-family: monospace;">${loc.latitude}, ${loc.longitude}</p>
              <p style="font-size: 11px; color: #64748b; margin-top: 2px;">${loc.is_monitored ? 'Monitored' : 'Idle'}</p>
            </div>
          `)
        )
        .addTo(map.current!)

      markersRef.current.push(marker)
    })
  }, [locations, selectedLocation, clearMarkers])

  useEffect(() => {
    if (map.current) return
    if (!mapboxgl.accessToken) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-95.7129, 37.0902],
      zoom: 3,
      attributionControl: false,
    })

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right')

    map.current.on('load', () => {
      if (locations && locations.length > 0) {
        updateMarkers()
      }
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [clearMarkers, locations, selectedLocation])

  useEffect(() => {
    if (map.current && locations && locations.length > 0) {
      updateMarkers()
    }
  }, [locations, updateMarkers])

  useEffect(() => {
    if (map.current && selectedLocation) {
      const loc = (locations as BackendLocation[] | undefined)?.find((l: BackendLocation) => l.id === selectedLocation)
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

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createLocation({
        name: newLocation.name,
        latitude: parseFloat(newLocation.latitude),
        longitude: parseFloat(newLocation.longitude),
        address: newLocation.address || undefined,
      })
      setNewLocation({ name: '', latitude: '', longitude: '', address: '' })
      setShowAddForm(false)
    } catch (err) {
      console.error('Failed to create location:', err)
    }
  }

  const handleCapture = async (locationId: string) => {
    setCapturing(locationId)
    try {
      await createCapture({ location_id: locationId })
    } catch (err) {
      console.error('Capture failed:', err)
    } finally {
      setCapturing(null)
    }
  }

  const filteredLocations = (locations as BackendLocation[] | undefined)?.filter(
    (loc: BackendLocation) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.address && loc.address.toLowerCase().includes(searchQuery.toLowerCase()))
  ) ?? []

  const selectedLocData = (locations as BackendLocation[] | undefined)?.find((l: BackendLocation) => l.id === selectedLocation)
  const selectedSchedule = (schedules as BackendSchedule[] | undefined)?.find((s: BackendSchedule) => s.location_id === selectedLocation)

  if (isLoading) {
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

  if (!mapboxgl.accessToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-sm font-mono text-yellow-400 mb-2">Mapbox token not configured</p>
          <p className="text-xs text-gray-500">Set VITE_MAPBOX_TOKEN in your environment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="w-80 bg-gray-950/80 backdrop-blur-sm border-r border-gray-800/50 flex flex-col">
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Surveillance Sites</h2>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {showAddForm ? (
            <form onSubmit={handleAddLocation} className="space-y-2 mb-3">
              <input
                type="text"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                placeholder="Location name"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={newLocation.latitude}
                  onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                  placeholder="Latitude"
                  className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono"
                  required
                />
                <input
                  type="number"
                  step="any"
                  value={newLocation.longitude}
                  onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                  placeholder="Longitude"
                  className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono"
                  required
                />
              </div>
              <input
                type="text"
                value={newLocation.address}
                onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                placeholder="Address (optional)"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono"
              />
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
              >
                Add Location
              </button>
            </form>
          ) : (
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
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredLocations.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No locations configured</p>
              <p className="text-xs text-gray-600 mt-1">Click + to add your first site</p>
            </div>
          ) : (
            filteredLocations.map((loc: BackendLocation) => (
              <div
                key={loc.id}
                className={`px-4 py-3 border-b border-gray-800/30 hover:bg-gray-800/30 transition-colors ${
                  selectedLocation === loc.id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => setSelectedLocation(loc.id)}
                    className="flex items-center gap-2 flex-1"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      loc.is_monitored ? 'bg-green-400' : 'bg-gray-500'
                    }`} />
                    <span className="text-sm font-medium text-white">{loc.name}</span>
                  </button>
                  <button
                    onClick={() => handleCapture(loc.id)}
                    disabled={capturing === loc.id}
                    className="p-1.5 bg-gray-800/50 border border-gray-700/50 rounded text-gray-400 hover:text-blue-400 hover:border-blue-500/30 transition-colors disabled:opacity-50"
                    title="Trigger capture"
                  >
                    {capturing === loc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Satellite className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-1 ml-4">
                  <span className="text-xs text-gray-500 font-mono">
                    {loc.latitude}, {loc.longitude}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

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
                  {selectedLocData.latitude}, {selectedLocData.longitude}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <span className={`text-xs font-mono uppercase ${
                  selectedLocData.is_monitored ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {selectedLocData.is_monitored ? 'Monitored' : 'Idle'}
                </span>
              </div>
              {selectedLocData.address && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Address</span>
                  <span className="text-xs font-mono text-gray-300">{selectedLocData.address}</span>
                </div>
              )}
              {selectedSchedule && (
                <>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Schedule</span>
                    <span className="text-xs font-mono text-blue-400 capitalize">{selectedSchedule.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Total Captures</span>
                    <span className="text-xs font-mono text-gray-300">{selectedSchedule.total_captures}</span>
                  </div>
                </>
              )}
              <button
                onClick={() => handleCapture(selectedLocData.id)}
                disabled={capturing === selectedLocData.id}
                className="w-full mt-3 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-mono uppercase hover:bg-blue-600/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {capturing === selectedLocData.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Satellite className="w-3.5 h-3.5" />
                    Trigger Capture
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />

        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono text-gray-300">Dark Satellite</span>
          </div>
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2 flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-400" />
            <span className="text-xs font-mono text-gray-300">{(locations as BackendLocation[] | undefined)?.filter((l: BackendLocation) => l.is_monitored).length ?? 0} Active</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-10 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2">
          <span className="text-xs font-mono text-gray-400">
            {selectedLocData
              ? `${selectedLocData.latitude} / ${selectedLocData.longitude}`
              : 'SELECT A TARGET'}
          </span>
        </div>
      </div>
    </div>
  )
}
